from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

class CompanyCreate(BaseModel):
    place_id: str
    name: str
    website: Optional[str] = None

class Company(CompanyCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime

class ContactCreate(BaseModel):
    company_id: UUID  # This will reference scraped_company.id
    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None

class Contact(ContactCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime

class EmailCampaignCreate(BaseModel):
    name: str
    template: str
    group_type: Optional[str] = None

class EmailCampaign(EmailCampaignCreate):
    id: UUID
    created_at: datetime

class SentEmailCreate(BaseModel):
    contact_id: UUID
    campaign_id: UUID
    status: str = "sent"
    response_received: bool = False

class SentEmail(SentEmailCreate):
    id: UUID
    sent_at: datetime

class CSVUploadResponse(BaseModel):
    message: str
    companies_created: int
    errors: list[str] = []

class ContactGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3b82f6"

class ContactGroup(ContactGroupCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime

class ContactGroupMemberCreate(BaseModel):
    group_id: UUID
    contact_id: UUID

class ContactGroupMember(ContactGroupMemberCreate):
    id: UUID
    added_at: datetime

class ContactEmailCreate(BaseModel):
    contact_id: UUID
    email: EmailStr
    is_valid: Optional[bool] = True
    is_deliverable: Optional[bool] = None
    found_by: Optional[str] = "mailscout"

class ContactEmail(ContactEmailCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime