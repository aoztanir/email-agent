import asyncio
import json
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional
from database.supabase_client import get_supabase_client
from models.scraping_job import ScrapeJob, ScrapeJobCreate, ScrapeJobStatus, ScrapeJobUpdate, ScrapeProgress
from services.searxng_scraper import SearxngScraper
from services.company_service import CompanyService
import uuid

class ScrapingJobManager:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.company_service = CompanyService()
        self.running_jobs: Dict[str, Dict] = {}  # job_id -> {thread, scraper, should_pause}
        self._init_jobs_table()
    
    def _init_jobs_table(self):
        """Create scraping jobs table if it doesn't exist"""
        try:
            # This would typically be handled by migrations in production
            self.supabase.table('scraping_job').select('id').limit(1).execute()
        except:
            # Table doesn't exist, create it
            sql = """
            CREATE TABLE IF NOT EXISTS scraping_jobs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                company_ids JSONB NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                total_companies INTEGER NOT NULL,
                processed_companies INTEGER DEFAULT 0,
                total_contacts_found INTEGER DEFAULT 0,
                linkedin_username TEXT NOT NULL,
                contacts_per_company INTEGER DEFAULT 20,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                started_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                error_message TEXT,
                current_company_id UUID,
                current_company_name TEXT
            );
            """
            # Note: In production, this should be handled by proper migration system
            pass

    def create_job(self, job_data: ScrapeJobCreate) -> ScrapeJob:
        """Create a new scraping job"""
        job_id = str(uuid.uuid4())
        
        job = ScrapeJob(
            id=job_id,
            name=job_data.name,
            company_ids=job_data.company_ids,
            status=ScrapeJobStatus.PENDING,
            total_companies=len(job_data.company_ids),
            processed_companies=0,
            total_contacts_found=0,
            contacts_per_company=job_data.contacts_per_company,
            group_id=job_data.group_id,
            created_at=datetime.now()
        )
        
        # Store job in database
        job_dict = job.model_dump()
        job_dict['company_ids'] = json.dumps(job_data.company_ids)
        # Convert datetime to string for JSON serialization
        if 'created_at' in job_dict and job_dict['created_at']:
            job_dict['created_at'] = job_dict['created_at'].isoformat()
        if 'started_at' in job_dict and job_dict['started_at']:
            job_dict['started_at'] = job_dict['started_at'].isoformat()
        if 'completed_at' in job_dict and job_dict['completed_at']:
            job_dict['completed_at'] = job_dict['completed_at'].isoformat()
        
        result = self.supabase.table('scraping_job').insert(job_dict).execute()
        
        # Store job state in memory
        self.running_jobs[job_id] = {
            'thread': None,
            'scraper': None,
            'should_pause': False,
            'should_stop': False
        }
        
        return job

    def get_job(self, job_id: str) -> Optional[ScrapeJob]:
        """Get a specific scraping job"""
        result = self.supabase.table('scraping_job').select('*').eq('id', job_id).execute()
        
        if not result.data:
            return None
        
        job_data = result.data[0]
        job_data['company_ids'] = json.loads(job_data['company_ids'])
        
        return ScrapeJob(**job_data)

    def get_all_jobs(self) -> List[ScrapeJob]:
        """Get all scraping jobs"""
        result = self.supabase.table('scraping_job').select('*').order('created_at', desc=True).execute()
        
        jobs = []
        for job_data in result.data:
            job_data['company_ids'] = json.loads(job_data['company_ids'])
            jobs.append(ScrapeJob(**job_data))
        
        return jobs

    def update_job(self, job_id: str, updates: ScrapeJobUpdate) -> Optional[ScrapeJob]:
        """Update a scraping job"""
        update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
        
        if updates.status == ScrapeJobStatus.RUNNING and 'started_at' not in update_dict:
            update_dict['started_at'] = datetime.now().isoformat()
        elif updates.status in [ScrapeJobStatus.COMPLETED, ScrapeJobStatus.FAILED, ScrapeJobStatus.CANCELLED]:
            update_dict['completed_at'] = datetime.now().isoformat()
        
        result = self.supabase.table('scraping_job').update(update_dict).eq('id', job_id).execute()
        
        if result.data:
            return self.get_job(job_id)
        return None

    def start_job(self, job_id: str) -> bool:
        """Start a scraping job"""
        job = self.get_job(job_id)
        if not job or job.status != ScrapeJobStatus.PENDING:
            return False
        
        if job_id not in self.running_jobs:
            return False
        
        # Update job status to running
        self.update_job(job_id, ScrapeJobUpdate(status=ScrapeJobStatus.RUNNING))
        
        # Start scraping in background thread
        scraper = SearxngScraper()
        
        self.running_jobs[job_id]['scraper'] = scraper
        thread = threading.Thread(target=self._run_scraping_job, args=(job_id, job, scraper))
        thread.daemon = True
        thread.start()
        
        self.running_jobs[job_id]['thread'] = thread
        
        return True

    def pause_job(self, job_id: str) -> bool:
        """Pause a running scraping job"""
        if job_id not in self.running_jobs:
            return False
        
        self.running_jobs[job_id]['should_pause'] = True
        self.update_job(job_id, ScrapeJobUpdate(status=ScrapeJobStatus.PAUSED))
        return True

    def resume_job(self, job_id: str) -> bool:
        """Resume a paused scraping job"""
        job = self.get_job(job_id)
        if not job or job.status != ScrapeJobStatus.PAUSED:
            return False
        
        if job_id in self.running_jobs:
            self.running_jobs[job_id]['should_pause'] = False
            self.update_job(job_id, ScrapeJobUpdate(status=ScrapeJobStatus.RUNNING))
            return True
        
        return False

    def stop_job(self, job_id: str) -> bool:
        """Stop a scraping job"""
        if job_id in self.running_jobs:
            self.running_jobs[job_id]['should_stop'] = True
            self.update_job(job_id, ScrapeJobUpdate(status=ScrapeJobStatus.CANCELLED))
            return True
        return False

    def stop_all_jobs(self) -> int:
        """Stop all running scraping jobs"""
        stopped_count = 0
        for job_id in list(self.running_jobs.keys()):
            if self.stop_job(job_id):
                stopped_count += 1
        return stopped_count

    def restart_job(self, job_id: str) -> bool:
        """Restart a failed, completed, or cancelled scraping job"""
        job = self.get_job(job_id)
        if not job or job.status not in [ScrapeJobStatus.FAILED, ScrapeJobStatus.COMPLETED, ScrapeJobStatus.CANCELLED]:
            return False
        
        # Reset job progress and status
        self.update_job(job_id, ScrapeJobUpdate(
            status=ScrapeJobStatus.PENDING,
            processed_companies=0,  # Reset to rescrape all companies
            total_contacts_found=0,
            error_message=None,
            current_company_id=None,
            current_company_name=None
        ))
        
        # Store job state for the restarted job
        self.running_jobs[job_id] = {
            'thread': None,
            'scraper': None,
            'should_pause': False,
            'should_stop': False
        }
        
        return True

    def delete_job(self, job_id: str) -> bool:
        """Delete a scraping job"""
        job = self.get_job(job_id)
        if not job:
            print(f"Job {job_id} not found")
            return False
        
        # Don't allow deletion of running jobs
        if job.status == ScrapeJobStatus.RUNNING:
            print(f"Cannot delete running job {job_id}")
            return False
        
        # Stop the job if it's paused (clean up any running threads)
        if job_id in self.running_jobs:
            self.running_jobs[job_id]['should_stop'] = True
            del self.running_jobs[job_id]
        
        # Delete from database
        try:
            result = self.supabase.table('scraping_job').delete().eq('id', job_id).execute()
            print(f"Delete result: {result.data}")
            return True  # Supabase delete always returns empty data, so we return True if no exception
        except Exception as e:
            print(f"Error deleting job from database: {e}")
            return False

    def get_job_progress(self, job_id: str) -> Optional[ScrapeProgress]:
        """Get progress of a scraping job"""
        job = self.get_job(job_id)
        if not job:
            return None
        
        # Calculate estimated remaining time
        estimated_time = None
        if job.processed_companies > 0 and job.status == ScrapeJobStatus.RUNNING:
            avg_time_per_company = 2  # Estimate 2 minutes per company
            remaining_companies = job.total_companies - job.processed_companies
            estimated_time = remaining_companies * avg_time_per_company
        
        return ScrapeProgress(
            job_id=job_id,
            total_companies=job.total_companies,
            processed_companies=job.processed_companies,
            current_company=job.current_company_name,
            contacts_found=job.total_contacts_found,
            status=job.status,
            estimated_remaining_time=estimated_time
        )

    def _run_scraping_job(self, job_id: str, job: ScrapeJob, scraper: SearxngScraper):
        """Run the actual scraping job in background"""
        try:
            companies = self.company_service.get_companies_by_ids(job.company_ids)
            total_contacts = 0
            processed = job.processed_companies  # Resume from where we left off
            
            for i in range(processed, len(companies)):
                # Check if should stop or pause
                if self.running_jobs[job_id]['should_stop']:
                    break
                
                while self.running_jobs[job_id]['should_pause']:
                    time.sleep(1)
                    if self.running_jobs[job_id]['should_stop']:
                        break
                
                if self.running_jobs[job_id]['should_stop']:
                    break
                
                company = companies[i]
                
                # Update current company
                self.update_job(job_id, ScrapeJobUpdate(
                    current_company_id=str(company.id),
                    current_company_name=company.name
                ))
                
                try:
                    # Scrape contacts for this company
                    result = scraper.scrape_company_contacts(
                        company.id, 
                        company.name, 
                        job.contacts_per_company,
                        group_id=job.group_id
                    )
                    
                    if 'contacts_created' in result:
                        total_contacts += result['contacts_created']
                    
                    processed += 1
                    
                    # Update progress
                    self.update_job(job_id, ScrapeJobUpdate(
                        processed_companies=processed,
                        total_contacts_found=total_contacts
                    ))
                    
                    # Delay between companies to respect rate limits
                    time.sleep(10)
                    
                except Exception as e:
                    # Log error but continue with next company
                    print(f"Error scraping company {company.name}: {e}")
                    processed += 1
                    self.update_job(job_id, ScrapeJobUpdate(
                        processed_companies=processed,
                        error_message=str(e)
                    ))
            
            # Job completed
            if not self.running_jobs[job_id]['should_stop']:
                self.update_job(job_id, ScrapeJobUpdate(
                    status=ScrapeJobStatus.COMPLETED,
                    processed_companies=processed,
                    total_contacts_found=total_contacts
                ))
            
        except Exception as e:
            self.update_job(job_id, ScrapeJobUpdate(
                status=ScrapeJobStatus.FAILED,
                error_message=str(e)
            ))
        
        finally:
            # Clean up
            if job_id in self.running_jobs:
                del self.running_jobs[job_id]

# Global instance
scraping_manager = ScrapingJobManager()