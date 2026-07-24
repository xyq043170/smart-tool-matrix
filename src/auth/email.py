import os
import logging
import resend

_logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "")
APP_URL = os.getenv("APP_URL", "")


def send_verification_email(to_email: str, token: str) -> bool:
    if not RESEND_API_KEY or not EMAIL_FROM or not APP_URL:
        _logger.error("Email delivery environment is incomplete; verification email was not sent")
        return False
    try:
        resend.api_key = RESEND_API_KEY
        verify_url = f"{APP_URL.rstrip('/')}/auth/verify?token={token}"
        resend.Emails.send({
            "from": EMAIL_FROM,
            "to": to_email,
            "subject": "Verify your email - Smart Tool Matrix",
            "html": (
                "<h2>Verify your email</h2>"
                "<p>Complete your Smart Tool Matrix registration by verifying your email.</p>"
                f"<p><a href='{verify_url}'>Verify email</a></p>"
                "<p>This link expires in 24 hours.</p>"
            ),
        })
        return True
    except Exception:
        _logger.exception("Failed to send verification email")
        return False


def send_reset_email(to_email: str, token: str) -> bool:
    if not RESEND_API_KEY or not EMAIL_FROM or not APP_URL:
        _logger.error("Email delivery environment is incomplete; password reset email was not sent")
        return False
    try:
        resend.api_key = RESEND_API_KEY
        reset_url = f"{APP_URL.rstrip('/')}/auth/reset-password?token={token}"
        resend.Emails.send({
            "from": EMAIL_FROM,
            "to": to_email,
            "subject": "Reset your password - Smart Tool Matrix",
            "html": f"<p><a href='{reset_url}'>Reset your password</a></p>",
        })
        return True
    except Exception:
        _logger.exception("Failed to send password reset email")
        return False
