from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class TokenBlacklist(Base):
    """Blacklisted JWT tokens (revoked on logout)."""
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    jti = Column(String(50), unique=True, nullable=False, index=True)  # JWT ID
    expires_at = Column(DateTime, nullable=False)  # Auto-cleanup after expiry
    created_at = Column(DateTime, server_default=func.now())
