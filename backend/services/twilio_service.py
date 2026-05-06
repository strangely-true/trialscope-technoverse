"""
Twilio SMS Service.
"""
import os
from dotenv import load_dotenv

load_dotenv()


def send_sms(to: str, body: str) -> dict:
    """Send an SMS via Twilio. Returns status dict."""
    try:
        from twilio.rest import Client
        client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
        message = client.messages.create(
            body=body,
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=to,
        )
        return {"status": "sent", "sid": message.sid}
    except Exception as e:
        print(f"[Twilio] SMS error: {e}")
        return {"status": "failed", "error": str(e)}
