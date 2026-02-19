"""Notifications router — manage in-app notifications."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# --- Pydantic Schemas ---

class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    read: bool
    route: Optional[str] = None
    price_change: Optional[float] = None
    created_at: datetime

    class Config:
        orm_mode = True


# --- Endpoints ---

@router.get("", response_model=List[NotificationOut])
def get_notifications(limit: int = 50, db: Session = Depends(get_db)):
    """Get latest notifications."""
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(limit).all()


@router.patch("/{id}/read")
def mark_as_read(id: int, db: Session = Depends(get_db)):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.read = True
    db.commit()
    return {"status": "ok"}


@router.patch("/read-all")
def mark_all_as_read(db: Session = Depends(get_db)):
    """Mark all notifications as read."""
    db.query(Notification).filter(Notification.read == False).update({"read": True})
    db.commit()
    return {"status": "ok"}


@router.patch("/{id}/unread")
def mark_as_unread(id: int, db: Session = Depends(get_db)):
    """Mark a notification as unread."""
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.read = False
    db.commit()
    return {"status": "ok"}


@router.delete("/{id}")
def delete_notification(id: int, db: Session = Depends(get_db)):
    """Delete a notification."""
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notif)
    db.commit()
    return {"status": "ok"}


@router.delete("/all")
def clear_all_notifications(db: Session = Depends(get_db)):
    """Delete all notifications."""
    db.query(Notification).delete()
    db.commit()
    return {"status": "ok"}
