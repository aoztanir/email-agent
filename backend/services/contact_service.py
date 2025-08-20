from typing import List, Dict, Any
from database.supabase_client import get_supabase_client
from models.models import ContactCreate, Contact

class ContactService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def create_contact(self, contact_data: ContactCreate, group_id: str = None) -> Contact:
        """Create a single contact and optionally assign to a group"""
        try:
            # Convert the data and ensure UUID is string
            data = contact_data.model_dump()
            data['company_id'] = str(data['company_id'])  # Convert UUID to string
            
            result = self.supabase.table("contact").insert(data).execute()
            contact = Contact(**result.data[0])
            
            # If group_id is provided, add contact to group
            if group_id:
                self.add_contact_to_group(contact.id, group_id)
            
            return contact
        except Exception as e:
            raise Exception(f"Error creating contact: {str(e)}")
    
    def add_contact_to_group(self, contact_id: str, group_id: str):
        """Add a contact to a group"""
        try:
            # Check if membership already exists
            existing = self.supabase.table("contact_group_member").select("*").eq("contact_id", contact_id).eq("group_id", group_id).execute()
            
            if not existing.data:
                # Add new membership
                self.supabase.table("contact_group_member").insert({
                    "contact_id": contact_id,
                    "group_id": group_id
                }).execute()
        except Exception as e:
            raise Exception(f"Error adding contact to group: {str(e)}")
    
    def get_contacts_by_company(self, company_id: str) -> List[Dict[str, Any]]:
        """Get all contacts for a specific company with their emails"""
        try:
            # Query contacts with their associated emails
            result = self.supabase.table("contact").select("*, contact_email(id, email, is_valid, is_deliverable, found_by)").eq("company_id", company_id).execute()
            
            # Transform the data to include emails array
            contacts_with_emails = []
            for contact_data in result.data:
                contact_emails = contact_data.pop('contact_email', [])
                contact = Contact(**contact_data)
                
                # Add emails as a separate property
                contact_dict = contact.model_dump()
                contact_dict['emails'] = contact_emails
                contacts_with_emails.append(contact_dict)
            
            return contacts_with_emails
        except Exception as e:
            raise Exception(f"Error fetching contacts: {str(e)}")
    
    def get_contacts_without_email(self, limit: int = 100) -> List[Contact]:
        """Get contacts that don't have email addresses"""
        try:
            result = self.supabase.table("contact").select("*").is_("email", "null").limit(limit).execute()
            return [Contact(**contact) for contact in result.data]
        except Exception as e:
            raise Exception(f"Error fetching contacts without email: {str(e)}")
    
    def update_contact_email(self, contact_id: str, email: str) -> Contact:
        """Update contact's email address"""
        try:
            result = self.supabase.table("contact").update({"email": email}).eq("id", contact_id).execute()
            if not result.data:
                raise Exception("Contact not found")
            return Contact(**result.data[0])
        except Exception as e:
            raise Exception(f"Error updating contact email: {str(e)}")
    
    def get_contact_by_id(self, contact_id: str) -> Contact:
        """Get contact by ID"""
        try:
            result = self.supabase.table("contact").select("*").eq("id", contact_id).execute()
            if not result.data:
                raise Exception("Contact not found")
            return Contact(**result.data[0])
        except Exception as e:
            raise Exception(f"Error fetching contact: {str(e)}")
    
    def get_all_contacts(self, limit: int = 100, offset: int = 0) -> List[Contact]:
        """Get all contacts with pagination"""
        try:
            result = self.supabase.table("contact").select("*").range(offset, offset + limit - 1).execute()
            return [Contact(**contact) for contact in result.data]
        except Exception as e:
            raise Exception(f"Error fetching contacts: {str(e)}")