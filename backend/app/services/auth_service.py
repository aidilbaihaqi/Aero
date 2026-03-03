"""
auth_service.py — Password hashing, JWT token creation/validation.
"""

import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# =============================================
# Password
# =============================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# =============================================
# JWT Tokens
# =============================================

def create_access_token(user_id: int) -> str:
    """Create a short-lived access token (30 min default)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "jti": str(uuid.uuid4()),
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: int, remember_me: bool = False) -> str:
    """Create a long-lived refresh token (7 days, or 30 days if remember_me)."""
    days = settings.REFRESH_TOKEN_EXPIRE_DAYS_LONG if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    expire = datetime.now(timezone.utc) + timedelta(days=days)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


# =============================================
# Token Blacklist
# =============================================

def is_token_blacklisted(db: Session, jti: str) -> bool:
    """Check if a token's JTI is in the blacklist."""
    return db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first() is not None


def blacklist_token(db: Session, jti: str, expires_at: datetime):
    """Add a token's JTI to the blacklist."""
    if not is_token_blacklisted(db, jti):
        entry = TokenBlacklist(jti=jti, expires_at=expires_at)
        db.add(entry)
        db.commit()


def cleanup_expired_blacklist(db: Session):
    """Remove expired entries from the blacklist."""
    db.query(TokenBlacklist).filter(
        TokenBlacklist.expires_at < datetime.now(timezone.utc)
    ).delete()
    db.commit()


# =============================================
# FastAPI Dependency
# =============================================

def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: extract and validate user from Bearer token."""
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak ditemukan")

    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid atau expired")

    # Check blacklist
    jti = payload.get("jti")
    if jti and is_token_blacklisted(db, jti):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sudah di-revoke")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User tidak ditemukan")

    return user
