import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional
from datetime import datetime
import time
import random

from database.supabase_client import get_supabase_client
from services.contact_service import ContactService
from models.models import EmailCampaignCreate, EmailCampaign, SentEmailCreate

class EmailSender:
    def __init__(self, smtp_server: str = None, smtp_port: int = 587, 
                 email: str = None, password: str = None):
        """
        Initialize email sender with SMTP configuration
        """
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.email = email
        self.password = password
        self.supabase = get_supabase_client()
        self.contact_service = ContactService()
    
    def create_campaign(self, campaign_data: EmailCampaignCreate) -> EmailCampaign:
        """
        Create a new email campaign
        """
        try:
            result = self.supabase.table("email_campaigns").insert(campaign_data.model_dump()).execute()
            return EmailCampaign(**result.data[0])
        except Exception as e:
            raise Exception(f"Error creating campaign: {str(e)}")
    
    def get_campaigns(self) -> List[EmailCampaign]:
        """
        Get all email campaigns
        """
        try:
            result = self.supabase.table("email_campaigns").select("*").execute()
            return [EmailCampaign(**campaign) for campaign in result.data]
        except Exception as e:
            raise Exception(f"Error fetching campaigns: {str(e)}")
    
    def format_email_template(self, template: str, contact_name: str, company_name: str) -> str:
        """
        Format email template with contact and company information
        """
        return template.format(
            contact_name=contact_name,
            company_name=company_name,
            first_name=contact_name.split()[0] if contact_name else ""
        )
    
    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """
        Send individual email
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.email
            message["To"] = to_email
            
            # Create HTML and text parts
            text_part = MIMEText(body, "plain")
            message.attach(text_part)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.email, self.password)
                server.sendmail(self.email, to_email, message.as_string())
            
            return True
            
        except Exception as e:
            print(f"Error sending email to {to_email}: {e}")
            return False
    
    def record_sent_email(self, contact_id: str, campaign_id: str, status: str = "sent") -> None:
        """
        Record sent email in database
        """
        try:
            sent_email_data = SentEmailCreate(
                contact_id=contact_id,
                campaign_id=campaign_id,
                status=status
            )
            
            self.supabase.table("sent_emails").insert(sent_email_data.model_dump()).execute()
            
        except Exception as e:
            print(f"Error recording sent email: {e}")
    
    def send_campaign_emails(self, campaign_id: str, contact_filters: Dict = None, 
                           delay_range: tuple = (5, 15)) -> Dict[str, any]:
        """
        Send emails for a specific campaign
        """
        try:
            # Get campaign details
            campaign_result = self.supabase.table("email_campaigns").select("*").eq("id", campaign_id).execute()
            if not campaign_result.data:
                raise Exception("Campaign not found")
            
            campaign = EmailCampaign(**campaign_result.data[0])
            
            # Get contacts with emails
            query = self.supabase.table("contacts").select("*, companies(name)").not_.is_("email", "null")
            
            # Apply filters if provided
            if contact_filters:
                if contact_filters.get("company_ids"):
                    query = query.in_("company_id", contact_filters["company_ids"])
            
            contacts_result = query.execute()
            contacts = contacts_result.data
            
            if not contacts:
                return {
                    "emails_sent": 0,
                    "errors": ["No contacts with emails found"]
                }
            
            emails_sent = 0
            errors = []
            
            for contact in contacts:
                try:
                    # Check if already sent to this contact for this campaign
                    existing_result = self.supabase.table("sent_emails").select("*").eq("contact_id", contact["id"]).eq("campaign_id", campaign_id).execute()
                    
                    if existing_result.data:
                        continue  # Skip if already sent
                    
                    # Format email template
                    formatted_body = self.format_email_template(
                        campaign.template,
                        contact["name"],
                        contact["companies"]["name"]
                    )
                    
                    # Generate subject (you can make this configurable)
                    subject = f"Partnership Opportunity with {contact['companies']['name']}"
                    
                    # Send email
                    if self.send_email(contact["email"], subject, formatted_body):
                        self.record_sent_email(contact["id"], campaign_id, "sent")
                        emails_sent += 1
                    else:
                        self.record_sent_email(contact["id"], campaign_id, "failed")
                        errors.append(f"Failed to send to {contact['name']} ({contact['email']})")
                    
                    # Add random delay between emails
                    delay = random.uniform(delay_range[0], delay_range[1])
                    time.sleep(delay)
                    
                except Exception as e:
                    errors.append(f"Error processing {contact.get('name', 'Unknown')}: {str(e)}")
                    continue
            
            return {
                "emails_sent": emails_sent,
                "total_contacts": len(contacts),
                "errors": errors
            }
            
        except Exception as e:
            return {
                "error": f"Failed to send campaign emails: {str(e)}",
                "emails_sent": 0
            }
    
    def get_campaign_stats(self, campaign_id: str) -> Dict[str, any]:
        """
        Get statistics for a campaign
        """
        try:
            # Get total sent emails
            sent_result = self.supabase.table("sent_emails").select("status").eq("campaign_id", campaign_id).execute()
            
            total_sent = len(sent_result.data)
            successful_sent = len([email for email in sent_result.data if email["status"] == "sent"])
            failed_sent = len([email for email in sent_result.data if email["status"] == "failed"])
            
            return {
                "total_sent": total_sent,
                "successful_sent": successful_sent,
                "failed_sent": failed_sent,
                "success_rate": (successful_sent / total_sent * 100) if total_sent > 0 else 0
            }
            
        except Exception as e:
            return {
                "error": f"Failed to get campaign stats: {str(e)}"
            }