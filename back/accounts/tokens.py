"""
accounts/tokens.py -- signed, expiring tokens for confirm/reset links.
"""

from django.core import signing

CONFIRM_SALT = "accounts.confirm-email"
RESET_SALT = "accounts.reset-password"
MAX_AGE = 60 * 60 * 24  # 24h


def make_confirm_token(user):
    return signing.dumps({"uid": str(user.id)}, salt=CONFIRM_SALT)


def read_confirm_token(token):
    data = signing.loads(token, salt=CONFIRM_SALT, max_age=MAX_AGE)
    return data["uid"]


def make_reset_token(user):
    return signing.dumps({"uid": str(user.id)}, salt=RESET_SALT)


def read_reset_token(token):
    data = signing.loads(token, salt=RESET_SALT, max_age=MAX_AGE)
    return data["uid"]
