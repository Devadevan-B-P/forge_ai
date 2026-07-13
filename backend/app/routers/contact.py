import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.core.config import settings

router = APIRouter(prefix="/api/contact", tags=["contact"])


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/send")
async def send_contact_email(body: ContactRequest):
    """Send a contact form email to the Forge AI team inbox."""
    if not settings.contact_email_pass or settings.contact_email_pass == "your_gmail_app_password_here":
        raise HTTPException(
            status_code=503,
            detail="Email sending is not configured yet. Please set CONTACT_EMAIL_PASS in backend/.env.",
        )

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Forge AI] {body.subject}"
        msg["From"] = f"Forge AI Contact <{settings.contact_email_from}>"
        msg["To"] = settings.contact_email_to
        msg["Reply-To"] = body.email

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #050505; color: #ffffff; margin: 0; padding: 20px; }}
            .card {{ background: #101216; border: 1px solid #252932; border-radius: 16px; padding: 32px; max-width: 560px; margin: 0 auto; }}
            .logo {{ font-size: 22px; font-weight: 600; color: #5FA9FF; margin-bottom: 24px; }}
            .field {{ margin-bottom: 20px; }}
            .label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #9AA3AF; margin-bottom: 6px; }}
            .value {{ font-size: 15px; color: #ffffff; }}
            .message-box {{ background: #050505; border: 1px solid #252932; border-radius: 10px; padding: 16px; margin-top: 6px; font-size: 14px; line-height: 1.7; color: #e2e8f0; white-space: pre-wrap; }}
            .divider {{ border: none; border-top: 1px solid #252932; margin: 24px 0; }}
            .footer {{ text-align: center; font-size: 11px; color: #9AA3AF; margin-top: 24px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">⚡ Forge AI — New Contact Message</div>
            <hr class="divider" />
            <div class="field">
              <div class="label">From</div>
              <div class="value">{body.name} &lt;{body.email}&gt;</div>
            </div>
            <div class="field">
              <div class="label">What they want to build</div>
              <div class="value">{body.subject}</div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="message-box">{body.message}</div>
            </div>
            <hr class="divider" />
            <div class="footer">Reply directly to this email to respond to {body.name}.</div>
          </div>
        </body>
        </html>
        """

        plain_body = (
            f"New Forge AI contact from {body.name} <{body.email}>\n\n"
            f"Subject: {body.subject}\n\n"
            f"Message:\n{body.message}"
        )

        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.contact_email_from, settings.contact_email_pass)
            server.sendmail(
                settings.contact_email_from,
                settings.contact_email_to,
                msg.as_string(),
            )

        return {"success": True, "message": "Message sent successfully."}

    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Email authentication failed. Check your Gmail App Password in .env.",
        )
    except smtplib.SMTPException as e:
        raise HTTPException(status_code=502, detail=f"SMTP error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
