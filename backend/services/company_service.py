import pandas as pd
from typing import List, Dict, Any
from database.supabase_client import get_supabase_client
from models.models import CompanyCreate, Company

class CompanyService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def create_company(self, company_data: CompanyCreate) -> Company:
        """Create a single company"""
        try:
            result = self.supabase.table("company").insert(company_data.model_dump()).execute()
            return Company(**result.data[0])
        except Exception as e:
            raise Exception(f"Error creating company: {str(e)}")
    
    def create_companies_from_csv(self, file_path: str) -> Dict[str, Any]:
        """Process CSV file and create companies"""
        try:
            # Read CSV file
            df = pd.read_csv(file_path)
            
            # Validate required columns
            required_columns = ['name', 'place_id']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            companies_created = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Create company data
                    company_data = CompanyCreate(
                        place_id=str(row['place_id']),
                        name=str(row['name']),
                        website=str(row.get('website', '')) if pd.notna(row.get('website')) else None
                    )
                    
                    # Insert into database
                    self.create_company(company_data)
                    companies_created += 1
                    
                except Exception as e:
                    errors.append(f"Row {index + 1}: {str(e)}")
            
            return {
                "message": f"Processed {len(df)} rows, created {companies_created} companies",
                "companies_created": companies_created,
                "errors": errors
            }
            
        except Exception as e:
            raise Exception(f"Error processing CSV file: {str(e)}")
    
    def get_companies(self, limit: int = 100, offset: int = 0) -> List[Company]:
        """Get list of companies"""
        try:
            result = self.supabase.table("company").select("*").range(offset, offset + limit - 1).execute()
            return [Company(**company) for company in result.data]
        except Exception as e:
            raise Exception(f"Error fetching companies: {str(e)}")
    
    def get_companies_by_ids(self, company_ids: List[str]) -> List[Company]:
        """Get companies by list of IDs"""
        try:
            result = self.supabase.table("company").select("*").in_("id", company_ids).execute()
            return [Company(**company) for company in result.data]
        except Exception as e:
            raise Exception(f"Error fetching companies by IDs: {str(e)}")
    
    def get_company_by_id(self, company_id: str) -> Company:
        """Get company by ID"""
        try:
            result = self.supabase.table("company").select("*").eq("id", company_id).execute()
            if not result.data:
                raise Exception("Company not found")
            return Company(**result.data[0])
        except Exception as e:
            raise Exception(f"Error fetching company: {str(e)}")