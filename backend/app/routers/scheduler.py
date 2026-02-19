"""Scheduler router — status and manual trigger for the scheduled scraping job."""

from fastapi import APIRouter, Depends, BackgroundTasks
from app.services.scheduler import get_scheduler_status, trigger_now
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


@router.get("/status")
def scheduler_status():
    """Return current scheduler state and next run time."""
    return get_scheduler_status()


@router.post("/trigger")
def trigger_scrape(
    background_tasks: BackgroundTasks,
    _user: User = Depends(get_current_user),
):
    """Manually trigger the scheduled scraping job in background. (Protected)"""
    background_tasks.add_task(trigger_now)
    return {"status": "triggered", "message": "Scheduled scrape job started in background."}
