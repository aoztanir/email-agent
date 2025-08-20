from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel
import uuid

class ScrapeJobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ScrapeJob(BaseModel):
    id: str
    name: str
    company_ids: List[str]
    status: ScrapeJobStatus
    total_companies: int
    processed_companies: int
    total_contacts_found: int
    contacts_per_company: int = 20
    group_id: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    current_company_id: Optional[str] = None
    current_company_name: Optional[str] = None

class ScrapeJobCreate(BaseModel):
    name: str
    company_ids: List[str]
    contacts_per_company: int = 20
    group_id: Optional[str] = None

class ScrapeJobUpdate(BaseModel):
    status: Optional[ScrapeJobStatus] = None
    processed_companies: Optional[int] = None
    total_contacts_found: Optional[int] = None
    error_message: Optional[str] = None
    current_company_id: Optional[str] = None
    current_company_name: Optional[str] = None

class ScrapeProgress(BaseModel):
    job_id: str
    total_companies: int
    processed_companies: int
    current_company: Optional[str] = None
    contacts_found: int
    status: ScrapeJobStatus
    estimated_remaining_time: Optional[int] = None  # in minutes
    errors: List[str] = []