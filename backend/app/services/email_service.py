import os
import requests
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "SupportAI")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")


class EmailService:
    BASE_URL = "https://api.brevo.com/v3/smtp/email"

    @staticmethod
    def load_template(template_path: str, replacements: dict) -> str:
        """
        Load an HTML template and replace placeholders.
        """
        with open(template_path, "r", encoding="utf-8") as file:
            html = file.read()

        for key, value in replacements.items():
            html = html.replace(f"{{{{{key}}}}}", str(value))

        return html

    @staticmethod
    def send_welcome_email(
        recipient_email: str,
        recipient_name: str,
        company_name: str,
        login_url: str
    ):
        """
        Sends a workspace creation email using Brevo.
        """

        template_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "templates",
            "welcome_email.html"
        )

        html_content = EmailService.load_template(
            template_path,
            {
                "user_name": recipient_name,
                "company_name": company_name,
                "login_url": login_url,
            },
        )

        payload = {
            "sender": {
                "name": BREVO_SENDER_NAME,
                "email": BREVO_SENDER_EMAIL,
            },
            "to": [
                {
                    "email": recipient_email,
                    "name": recipient_name,
                }
            ],
            "subject": "🎉 Your SupportAI Workspace is Ready!",
            "htmlContent": html_content,
        }

        headers = {
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
        }

        response = requests.post(
            EmailService.BASE_URL,
            json=payload,
            headers=headers,
            timeout=15,
        )

        if response.status_code not in (200, 201):
            raise Exception(
                f"Brevo Error ({response.status_code}): {response.text}"
            )

        return response.json()