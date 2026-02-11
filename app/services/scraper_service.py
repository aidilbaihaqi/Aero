"""
scraper_service.py — Orchestrate scraping dari semua sumber dan simpan ke database.
"""

import time
import uuid
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.models.flight import FlightFare
from app.scrapers.garuda import scrape_garuda, URL_GARUDA
from app.scrapers.citilink import scrape_citilink, URL_CITILINK
from app.scrapers.bookcabin import scrape_bookcabin, URL_BOOKCABIN


def generate_dates(start: date, end: date) -> list[str]:
    """Generate list tanggal string dari start sampai end (inclusive)."""
    dates = []
    current = start
    while current <= end:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return dates


def _normalize_garuda(flight: dict, run_id: str, scrape_dt: date, run_type: str) -> dict:
    """Normalize output garuda scraper ke format FlightFare."""
    return {
        "route": flight["route"],
        "airline": flight["airline"],
        "source": "garuda_api",
        "travel_date": datetime.strptime(flight["travel_date"], "%Y-%m-%d").date(),
        "flight_number": flight["flight_number"],
        "depart_time": flight["depart_time"],
        "arrive_time": flight["arrival_time"],
        "basic_fare": flight["total_fare"],
        "currency": "IDR",
        "scrape_date": scrape_dt,
        "scrape_source_page": URL_GARUDA,
        "run_id": run_id,
        "run_type": run_type,
        "source_type": "airline",
        "raw_price_label": flight.get("fare_family", ""),
        "status_scrape": "SUCCESS",
    }


def _normalize_citilink(flight: dict, run_id: str, scrape_dt: date, run_type: str) -> dict:
    """Normalize output citilink scraper ke format FlightFare."""
    return {
        "route": flight["route"],
        "airline": flight["airline"],
        "source": "citilink_api",
        "travel_date": datetime.strptime(flight["travel_date"], "%Y-%m-%d").date(),
        "flight_number": flight["flight_number"],
        "depart_time": flight["depart_time"],
        "arrive_time": flight["arrival_time"],
        "basic_fare": flight["fare_total"],
        "currency": "IDR",
        "scrape_date": scrape_dt,
        "scrape_source_page": URL_CITILINK,
        "run_id": run_id,
        "run_type": run_type,
        "source_type": "airline",
        "raw_price_label": "",
        "status_scrape": "SUCCESS",
    }


def _normalize_bookcabin(flight: dict, run_id: str, scrape_dt: date, run_type: str) -> dict:
    """Normalize output bookcabin scraper ke format FlightFare."""
    return {
        "route": flight["route"],
        "airline": flight["airline"],
        "source": "bookcabin_api",
        "travel_date": datetime.strptime(flight["travel_date"], "%Y-%m-%d").date(),
        "flight_number": flight["flight_number"],
        "depart_time": flight["depart_time"],
        "arrive_time": flight["arrival_time"],
        "basic_fare": flight["total_fare"],
        "currency": "IDR",
        "scrape_date": scrape_dt,
        "scrape_source_page": URL_BOOKCABIN,
        "run_id": run_id,
        "run_type": run_type,
        "source_type": "bookcabin",
        "raw_price_label": "",
        "status_scrape": "SUCCESS",
    }


def _save_error(db: Session, run_id: str, scrape_dt: date, run_type: str,
                source: str, source_type: str, route: str,
                travel_date_str: str, error: str, url: str):
    """Simpan record error ke database."""
    record = FlightFare(
        route=route,
        airline="-",
        source=source,
        travel_date=datetime.strptime(travel_date_str, "%Y-%m-%d").date(),
        flight_number="-",
        depart_time="-",
        arrive_time="-",
        basic_fare=0,
        currency="IDR",
        scrape_date=scrape_dt,
        scrape_source_page=url,
        error_reason=str(error),
        run_id=run_id,
        run_type=run_type,
        source_type=source_type,
        status_scrape="FAILED",
    )
    db.add(record)


def _mark_lowest_fares(records: list[dict]) -> list[dict]:
    """Mark is_lowest_fare=True untuk harga terendah per airline+travel_date."""
    # Group by airline + travel_date
    groups: dict[str, list[dict]] = {}
    for r in records:
        key = f"{r['airline']}|{r['travel_date']}"
        groups.setdefault(key, []).append(r)

    for group in groups.values():
        min_fare = min(r["basic_fare"] for r in group if r.get("status_scrape") == "SUCCESS")
        for r in group:
            r["is_lowest_fare"] = (r["basic_fare"] == min_fare and r.get("status_scrape") == "SUCCESS")

    return records


def scrape_and_save(
    db: Session,
    origin: str,
    destination: str,
    start_date: date,
    end_date: date,
    citilink_token: str | None = None,
    run_type: str = "MANUAL",
) -> dict:
    """
    Scrape seluruh tanggal dari semua sumber dan simpan ke database.

    Returns:
        dict dengan run_id, total_records, dan stats per source.
    """
    run_id = str(uuid.uuid4())
    scrape_dt = date.today()
    route = f"{origin}-{destination}"
    token = citilink_token or settings.CITILINK_TOKEN
    dates = generate_dates(start_date, end_date)

    all_records: list[dict] = []
    stats = {
        "garuda_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
        "citilink_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
        "bookcabin_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
    }

    for date_str in dates:
        # --- Garuda ---
        try:
            flights = scrape_garuda(origin, destination, date_str)
            for f in flights:
                all_records.append(_normalize_garuda(f, run_id, scrape_dt, run_type))
            stats["garuda_api"]["total_flights"] += len(flights)
            if flights:
                stats["garuda_api"]["total_dates"] += 1
        except Exception as e:
            stats["garuda_api"]["errors"] += 1
            _save_error(db, run_id, scrape_dt, run_type, "garuda_api", "airline",
                        route, date_str, str(e), URL_GARUDA)
        time.sleep(settings.SCRAPE_DELAY)

        # --- Citilink ---
        if token:
            try:
                flights = scrape_citilink(origin, destination, date_str, token)
                for f in flights:
                    all_records.append(_normalize_citilink(f, run_id, scrape_dt, run_type))
                stats["citilink_api"]["total_flights"] += len(flights)
                if flights:
                    stats["citilink_api"]["total_dates"] += 1
            except Exception as e:
                stats["citilink_api"]["errors"] += 1
                _save_error(db, run_id, scrape_dt, run_type, "citilink_api", "airline",
                            route, date_str, str(e), URL_CITILINK)
            time.sleep(settings.SCRAPE_DELAY)

        # --- BookCabin ---
        try:
            flights = scrape_bookcabin(origin, destination, date_str)
            for f in flights:
                all_records.append(_normalize_bookcabin(f, run_id, scrape_dt, run_type))
            stats["bookcabin_api"]["total_flights"] += len(flights)
            if flights:
                stats["bookcabin_api"]["total_dates"] += 1
        except Exception as e:
            stats["bookcabin_api"]["errors"] += 1
            _save_error(db, run_id, scrape_dt, run_type, "bookcabin_api", "bookcabin",
                        route, date_str, str(e), URL_BOOKCABIN)
        time.sleep(settings.SCRAPE_DELAY)

    # Mark lowest fares
    if all_records:
        all_records = _mark_lowest_fares(all_records)

    # Bulk insert ke database
    for r in all_records:
        db.add(FlightFare(**r))
    db.commit()

    return {
        "run_id": run_id,
        "route": route,
        "start_date": start_date,
        "end_date": end_date,
        "run_type": run_type,
        "total_records": len(all_records),
        "stats": [
            {"source": src, **data}
            for src, data in stats.items()
        ],
    }
