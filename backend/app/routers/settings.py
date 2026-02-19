"""Settings router — read / update persistent application configuration."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.database import get_db
from app.models.settings import AppSetting
from app.models.flight import FlightFare, ScrapeRun
from app.config import settings as app_config

router = APIRouter(prefix="/api/settings", tags=["settings"])


# --- Pydantic schemas ---

class SettingsOut(BaseModel):
    scrape_delay: float
    schedule_time: str
    end_date: str
    citilink_token: str   # masked for display
    max_retry: int
    db_status: str
    db_total_records: int
    db_total_runs: int


class SettingsUpdate(BaseModel):
    scrape_delay: float | None = None
    schedule_time: str | None = None
    end_date: str | None = None
    citilink_token: str | None = None
    max_retry: int | None = None


# --- Helpers ---

def _get_setting(db: Session, key: str, default: str = "") -> str:
    """Get a setting value from DB, fallback to default."""
    row = db.query(AppSetting).filter(AppSetting.key == key).first()
    return row.value if row else default


def _set_setting(db: Session, key: str, value: str):
    """Upsert a setting value."""
    row = db.query(AppSetting).filter(AppSetting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(AppSetting(key=key, value=value))


# --- Endpoints ---

@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    """Return current application settings (merged: DB overrides + env defaults)."""
    scrape_delay = float(_get_setting(db, "scrape_delay", str(app_config.SCRAPE_DELAY)))
    schedule_time = _get_setting(db, "schedule_time", "07:30")
    end_date = _get_setting(db, "end_date", app_config.DEFAULT_END_DATE)
    max_retry = int(_get_setting(db, "max_retry", "3"))

    # Citilink token: show masked
    raw_token = _get_setting(db, "citilink_token", app_config.CITILINK_TOKEN)
    masked = (raw_token[:10] + "..." + raw_token[-6:]) if len(raw_token) > 20 else ("***" if raw_token else "")

    # DB stats
    total_records = db.query(sqlfunc.count(FlightFare.id)).scalar() or 0
    total_runs = db.query(sqlfunc.count(ScrapeRun.id)).scalar() or 0

    return SettingsOut(
        scrape_delay=scrape_delay,
        schedule_time=schedule_time,
        end_date=end_date,
        citilink_token=masked,
        max_retry=max_retry,
        db_status="Connected",
        db_total_records=total_records,
        db_total_runs=total_runs,
    )


@router.put("")
def update_settings(body: SettingsUpdate, db: Session = Depends(get_db)):
    """Update application settings (persisted in DB)."""
    updated = []
    if body.scrape_delay is not None:
        _set_setting(db, "scrape_delay", str(body.scrape_delay))
        updated.append("scrape_delay")
    if body.schedule_time is not None:
        _set_setting(db, "schedule_time", body.schedule_time)
        updated.append("schedule_time")
    if body.end_date is not None:
        _set_setting(db, "end_date", body.end_date)
        updated.append("end_date")
    if body.citilink_token is not None:
        _set_setting(db, "citilink_token", body.citilink_token)
        updated.append("citilink_token")
    if body.max_retry is not None:
        _set_setting(db, "max_retry", str(body.max_retry))
        updated.append("max_retry")

    db.commit()
    return {"status": "ok", "updated": updated}


@router.post("/validate-token")
def validate_citilink_token(db: Session = Depends(get_db)):
    """Test the stored Citilink token with a dummy API call."""
    import requests

    raw_token = _get_setting(db, "citilink_token", app_config.CITILINK_TOKEN)
    if not raw_token:
        return {"valid": False, "error": "No token configured"}

    try:
        headers = {
            "Authorization": f"Bearer {raw_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0",
            "Origin": "https://book2.citilink.co.id",
            "Referer": "https://book2.citilink.co.id/",
        }
        payload = {
            "criteria": [{"dates": {"beginDate": "2026-03-01"},
                          "filters": {"bundleControlFilter": 2, "compressionType": 1, "exclusionType": 0, "maxConnections": 10, "productClasses": ["NR"]},
                          "stations": {"originStationCodes": ["BTH"], "destinationStationCodes": ["CGK"], "searchDestinationMacs": True, "searchOriginMacs": True}}],
            "codes": {"currencyCode": "IDR"}
        }
        resp = requests.post(
            "https://dotrezapi-akm.prod.citilink.co.id/qg/dotrez/api/nsk/v1/availability/search/ssr",
            headers=headers,
            json=payload,
            timeout=10,
        )
        if resp.status_code in (401, 403):
            return {"valid": False, "error": f"Token rejected (HTTP {resp.status_code})"}
        resp.raise_for_status()
        return {"valid": True}
    except requests.exceptions.Timeout:
        return {"valid": False, "error": "Request timeout"}
    except requests.exceptions.RequestException as e:
        return {"valid": False, "error": str(e)}
