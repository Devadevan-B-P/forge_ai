import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from app.core.config import settings

router = APIRouter(prefix="/api/contact", tags=["contact"])


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., max_length=150)
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=3000)


@router.post("")
async def send_contact_message(req: ContactRequest):
    template_params = {
        "name": req.name,
        "email": req.email,
        "project": req.subject,
        "message": req.message,
        "time": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
    }

    # 1. Send via EmailJS if configured
    if settings.emailjs_public_key and settings.emailjs_service_id:
        url = "https://api.emailjs.com/api/v1.0/email/send"

        async def send_email(template_id: str):
            payload = {
                "service_id": settings.emailjs_service_id.strip(),
                "template_id": template_id.strip(),
                "user_id": settings.emailjs_public_key.strip(),
                "template_params": template_params,
            }
            if settings.emailjs_private_key:
                payload["accessToken"] = settings.emailjs_private_key.strip()

            async with httpx.AsyncClient() as client:
                print(f"[DEBUG] Dispatching EmailJS template: {template_id.strip()}")
                res = await client.post(url, json=payload, timeout=10.0)
                if res.status_code != 200:
                    raise RuntimeError(f"Template {template_id.strip()} failed with error ({res.status_code}): {res.text}")

        try:
            tasks = []
            if settings.emailjs_contact_template_id and settings.emailjs_contact_template_id.strip():
                tasks.append(send_email(settings.emailjs_contact_template_id))
            if settings.emailjs_auto_reply_template_id and settings.emailjs_auto_reply_template_id.strip():
                tasks.append(send_email(settings.emailjs_auto_reply_template_id))

            if tasks:
                await asyncio.gather(*tasks)
            return {"detail": "Message sent successfully via EmailJS."}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"EmailJS sending failed: {str(e)}",
            )

    # 2. Fallback to SMTP if configured
    elif settings.contact_email_to and settings.contact_email_from and settings.contact_email_pass:
        try:
            # Send notification email to contact_email_to
            msg = MIMEMultipart()
            msg["From"] = settings.contact_email_from
            msg["To"] = settings.contact_email_to
            msg["Subject"] = f"New Forge AI Contact Message: {req.subject}"

            body = (
                f"Name: {req.name}\n"
                f"Email: {req.email}\n"
                f"Subject: {req.subject}\n"
                f"Message:\n{req.message}\n"
            )
            msg.attach(MIMEText(body, "plain"))

            # Run synchronous SMTP operations in thread pool
            import anyio

            def send_smtp():
                with smtplib.SMTP("smtp.gmail.com", 587) as server:
                    server.starttls()
                    server.login(settings.contact_email_from, settings.contact_email_pass)
                    server.send_message(msg)

                    # Send auto-reply to user
                    reply_msg = MIMEMultipart()
                    reply_msg["From"] = settings.contact_email_from
                    reply_msg["To"] = req.email
                    reply_msg["Subject"] = "Thank you for contacting Forge AI!"
                    reply_body = (
                        f"Hello {req.name},\n\n"
                        f"Thank you for reaching out to us. We have received your message and will get back to you shortly.\n\n"
                        f"Best regards,\n"
                        f"The Forge AI Team"
                    )
                    reply_msg.attach(MIMEText(reply_body, "plain"))
                    server.send_message(reply_msg)

            await anyio.to_thread.run_sync(send_smtp)
            return {"detail": "Message sent successfully via SMTP."}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"SMTP sending failed: {str(e)}",
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="No email service (EmailJS or SMTP) is configured on the backend.",
        )
