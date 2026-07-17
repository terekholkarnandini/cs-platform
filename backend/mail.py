from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.email_service import EmailService

router = APIRouter(prefix="/emails", tags=["Emails"])


class WelcomeEmailRequest(BaseModel):
    email: str
    user_name: str
    company_name: str


@router.post("/welcome")
async def send_welcome_email(data: WelcomeEmailRequest):
    try:
        EmailService.send_welcome_email(
            recipient_email=data.email,
            recipient_name=data.user_name,
            company_name=data.company_name,
            login_url="http://localhost:8080/login",  # Replace with your frontend URL
        )

        return {
            "success": True,
            "message": "Welcome email sent successfully."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )