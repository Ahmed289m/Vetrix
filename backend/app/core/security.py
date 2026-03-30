from datetime import datetime, timedelta, timezone
from typing import Any
import hashlib

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _preprocess_password(password: str) -> str:
    """
    Pre-hash password with SHA256 before bcrypt.
    
    This ensures:
    - Password is always 64 characters (SHA256 hex digest) - well under bcrypt's 72-byte limit
    - Consistent length regardless of input
    - Resolves bcrypt compatibility issues
    
    Args:
        password: Raw password string
        
    Returns:
        SHA256 hex digest (64 chars)
    """
    if not isinstance(password, str):
        password = str(password)
    return hashlib.sha256(password.encode()).hexdigest()


def get_password_hash(password: str) -> str:
    """Hash password using SHA256 preprocessing + bcrypt"""
    preprocessed = _preprocess_password(password)
    return pwd_context.hash(preprocessed)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password with backward compatibility.
    
    Supports both:
    - New method: SHA256 preprocessing → bcrypt (used for new passwords)
    - Old method: Direct bcrypt (used for old passwords before SHA256 fix)
    
    This ensures seamless login for both old and new users after the security update.
    
    Args:
        plain_password: Raw password from login attempt
        hashed_password: Password hash from database
        
    Returns:
        True if password matches (either method), False otherwise
    """
    if not isinstance(plain_password, str):
        plain_password = str(plain_password)
    
    try:
        # Try new method: SHA256 preprocessing + bcrypt
        preprocessed = _preprocess_password(plain_password)
        if pwd_context.verify(preprocessed, hashed_password):
            return True
    except Exception:
        # If new method fails, continue to old method
        pass
    
    try:
        # Fallback to old method: direct bcrypt (for pre-SHA256 passwords)
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except Exception:
        # Both methods failed
        pass
    
    return False


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a JWT access token with optional extra claims (role, clinic_id, is_superuser).
    
    Args:
        subject: User identifier (typically user_id or email)
        expires_delta: Custom expiration time
        extra_claims: Additional claims to include (role, clinic_id, is_superuser, email)
    
    Returns:
        Encoded JWT token string
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )

    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(
    subject: str,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.refresh_token_expire_minutes)
    )

    payload: dict[str, Any] = {"sub": subject, "exp": expire, "type": "refresh"}
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def get_token_subject(token: str) -> str | None:
    try:
        payload = decode_token(token)
        return payload.get("sub")
    except JWTError:
        return None
