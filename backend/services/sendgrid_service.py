"""
SendGrid Email Service.
"""
import os
from dotenv import load_dotenv

load_dotenv()


def send_email(to: str, subject: str, body: str) -> dict:
    """Send an email via SendGrid. Returns status dict."""
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))
        message = Mail(
            from_email=os.getenv("SENDGRID_FROM_EMAIL", "noreply@trialgo.ai"),
            to_emails=to,
            subject=subject,
            plain_text_content=body,
        )
        response = sg.send(message)
        return {"status": "sent", "status_code": response.status_code}
    except Exception as e:
        print(f"[SendGrid] Email error: {e}")
        return {"status": "failed", "error": str(e)}
