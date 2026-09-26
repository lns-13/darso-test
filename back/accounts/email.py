"""
accounts/email.py -- Phase 3. Sends via Resend.
"""

import os
import resend
from django.conf import settings

resend.api_key = settings.RESEND_API_KEY


def send_confirmation_email(user, token):
    link = f"{settings.FRONTEND_URL}/auth/callback?token={token}&type=confirm"
    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": user.email,
        "subject": "Confirm your email",
        "html": f'<p>Click to confirm: <a href="{link}">{link}</a></p>',
    })


def send_password_reset_email(user, token):
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": user.email,
        "subject": "Reset your password",
        "html": f'<p>Click to reset: <a href="{link}">{link}</a></p>',
    })
