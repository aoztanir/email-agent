from typing import List, Optional
from uuid import UUID
from database.supabase_client import get_supabase_client
from models.models import ContactEmailCreate, ContactEmail
from pydantic import EmailStr


class ContactEmailService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def create_contact_email(self, email_data: ContactEmailCreate) -> Optional[ContactEmail]:
        """
        Create a new contact email record
        """
        try:
            # Check if this email already exists for this contact
            existing = self.supabase.table('contact_email').select('*').eq(
                'contact_id', str(email_data.contact_id)
            ).eq('email', email_data.email).execute()
            
            if existing.data:
                print(f"Email {email_data.email} already exists for contact {email_data.contact_id}")
                return ContactEmail(**existing.data[0])
            
            # Insert new email record
            result = self.supabase.table('contact_email').insert({
                'contact_id': str(email_data.contact_id),
                'email': email_data.email,
                'is_valid': email_data.is_valid,
                'is_deliverable': email_data.is_deliverable,
                'found_by': email_data.found_by
            }).execute()
            
            if result.data:
                return ContactEmail(**result.data[0])
            return None
            
        except Exception as e:
            print(f"Error creating contact email: {e}")
            return None
    
    def get_contact_emails(self, contact_id: UUID) -> List[ContactEmail]:
        """
        Get all email addresses for a specific contact
        """
        try:
            result = self.supabase.table('contact_email').select('*').eq(
                'contact_id', str(contact_id)
            ).order('created_at', desc=True).execute()
            
            if result.data:
                return [ContactEmail(**email) for email in result.data]
            return []
            
        except Exception as e:
            print(f"Error fetching contact emails: {e}")
            return []
    
    def update_email_deliverability(self, email_id: UUID, is_deliverable: bool) -> bool:
        """
        Update the deliverability status of an email
        """
        try:
            result = self.supabase.table('contact_email').update({
                'is_deliverable': is_deliverable
            }).eq('id', str(email_id)).execute()
            
            return bool(result.data)
            
        except Exception as e:
            print(f"Error updating email deliverability: {e}")
            return False
    
    def bulk_create_contact_emails(self, emails_data: List[ContactEmailCreate]) -> int:
        """
        Create multiple contact email records in bulk
        """
        created_count = 0
        
        for email_data in emails_data:
            if self.create_contact_email(email_data):
                created_count += 1
        
        return created_count
    
    def delete_contact_email(self, email_id: UUID) -> bool:
        """
        Delete a contact email record
        """
        try:
            result = self.supabase.table('contact_email').delete().eq(
                'id', str(email_id)
            ).execute()
            
            return bool(result.data)
            
        except Exception as e:
            print(f"Error deleting contact email: {e}")
            return False
    
    def get_all_emails_for_contacts(self, contact_ids: List[UUID]) -> dict:
        """
        Get all emails for multiple contacts, organized by contact_id
        """
        try:
            contact_ids_str = [str(cid) for cid in contact_ids]
            result = self.supabase.table('contact_email').select('*').in_(
                'contact_id', contact_ids_str
            ).execute()
            
            emails_by_contact = {}
            if result.data:
                for email_record in result.data:
                    contact_id = email_record['contact_id']
                    if contact_id not in emails_by_contact:
                        emails_by_contact[contact_id] = []
                    emails_by_contact[contact_id].append(ContactEmail(**email_record))
            
            return emails_by_contact
            
        except Exception as e:
            print(f"Error fetching emails for contacts: {e}")
            return {}