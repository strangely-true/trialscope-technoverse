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
        tw_sid = os.getenv("TWILIO_ACCOUNT_SID")
        tw_token = os.getenv("TWILIO_AUTH_TOKEN")
        tw_phone = os.getenv("TWILIO_PHONE_NUMBER")
        if not (tw_sid and tw_token and tw_phone):
            return {"status": "disabled", "error": "Twilio not configured on server"}

        client = Client(tw_sid, tw_token)
        message = client.messages.create(
            body=body,
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=to,
        )
        return {"status": "sent", "sid": message.sid}
    except Exception as e:
        print(f"[Twilio] SMS error: {e}")
        return {"status": "failed", "error": str(e)}
