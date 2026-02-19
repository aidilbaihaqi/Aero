"""
scheduler.py — APScheduler integration for daily scheduled scraping.

Runs scrape_and_save() for all DEFAULT_ROUTES at the configured time (default 07:30 WIB).
"""

import logging
from datetime import date, datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import SessionLocal
from app.config import settings
from app.models.settings import AppSetting
from app.services.scraper_service import scrape_and_save

logger = logging.getLogger("aero.scheduler")

scheduler = BackgroundScheduler(timezone="Asia/Jakarta")


def _get_schedule_time() -> tuple[int, int]:
    """Read schedule_time from DB, fallback to 07:30."""
    db = SessionLocal()
    try:
        row = db.query(AppSetting).filter(AppSetting.key == "schedule_time").first()
        time_str = row.value if row else "07:30"
        parts = time_str.split(":")
        return int(parts[0]), int(parts[1])
    finally:
        db.close()


def _get_end_date() -> date:
    """Read end_date from DB, fallback to config."""
    db = SessionLocal()
    try:
        row = db.query(AppSetting).filter(AppSetting.key == "end_date").first()
        date_str = row.value if row else settings.DEFAULT_END_DATE
        return date.fromisoformat(date_str)
    finally:
        db.close()


def _get_citilink_token() -> str:
    """Read citilink_token from DB, fallback to config."""
    db = SessionLocal()
    try:
        row = db.query(AppSetting).filter(AppSetting.key == "citilink_token").first()
        return row.value if row else settings.CITILINK_TOKEN
    finally:
        db.close()


def scheduled_scrape_job():
    """Job function: scrape all default routes."""
    logger.info("=== Scheduled scraping started ===")
    db = SessionLocal()
    try:
        today = date.today()
        end_dt = _get_end_date()
        token = _get_citilink_token()

        if today > end_dt:
            logger.info("Past end_date (%s), skipping.", end_dt)
            return

        for route_cfg in settings.DEFAULT_ROUTES:
            origin = route_cfg["origin"]
            destination = route_cfg["destination"]
            logger.info("Scraping %s-%s ...", origin, destination)
            try:
                result = scrape_and_save(
                    db=db,
                    origin=origin,
                    destination=destination,
                    start_date=today,
                    end_date=end_dt,
                    citilink_token=token,
                    run_type="SCHEDULED",
                )
                logger.info("  -> %s records", result["total_records"])
            except Exception as e:
                logger.error("  -> Error scraping %s-%s: %s", origin, destination, e)

        logger.info("=== Scheduled scraping finished ===")
    finally:
        db.close()


def start_scheduler():
    """Start the background scheduler."""
    hour, minute = _get_schedule_time()

    scheduler.add_job(
        scheduled_scrape_job,
        trigger=CronTrigger(hour=hour, minute=minute, timezone="Asia/Jakarta"),
        id="daily_scrape",
        name="Daily Scheduled Scrape",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — next run at %02d:%02d WIB", hour, minute)


def stop_scheduler():
    """Shutdown the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")


def get_scheduler_status() -> dict:
    """Return scheduler status info."""
    job = scheduler.get_job("daily_scrape")
    return {
        "running": scheduler.running,
        "job_id": "daily_scrape" if job else None,
        "next_run_time": job.next_run_time.isoformat() if job and job.next_run_time else None,
    }


def trigger_now():
    """Manually trigger the scheduled job immediately."""
    logger.info("Manual trigger requested")
    scheduled_scrape_job()
