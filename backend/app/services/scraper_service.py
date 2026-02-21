"""
scraper_service.py — Orchestrate scraping dan simpan ke database (3-table structure).

Optimised version:
- Concurrent date processing (batch of 5 dates in parallel)
- Background task with progress tracking
- Reduced retry (2 attempts, max 4s backoff)
- HTTP timeout on all scrapers
"""

import time
import uuid
import logging
import statistics
import threading
from datetime import date, datetime, timedelta
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Optional

import requests as req_lib
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.flight import ScrapeRun, FlightFare, FareDailySummary
from app.models.notification import Notification
from app.scrapers.garuda import scrape_garuda, URL_GARUDA
from app.scrapers.citilink import scrape_citilink, URL_CITILINK
from app.scrapers.bookcabin import scrape_bookcabin, URL_BOOKCABIN

logger = logging.getLogger("aero.scraper")

# --- Retry decorator (optimised: 2 attempts, max 4s backoff) ---
_scrape_retry = retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type((req_lib.exceptions.RequestException, TimeoutError, ConnectionError)),
    reraise=True,
)

# =============================================
# In-memory job progress store
# =============================================

_job_progress: dict[str, dict] = {}
_job_lock = threading.Lock()


def get_job_progress(job_id: str) -> dict | None:
    with _job_lock:
        return _job_progress.get(job_id, None)


def _set_job_progress(job_id: str, data: dict):
    with _job_lock:
        _job_progress[job_id] = data


def _cleanup_job(job_id: str, delay: int = 300):
    """Remove job from memory after delay seconds."""
    def _remove():
        time.sleep(delay)
        with _job_lock:
            _job_progress.pop(job_id, None)
    threading.Thread(target=_remove, daemon=True).start()


def generate_dates(start: date, end: date) -> list[str]:
    dates = []
    current = start
    while current <= end:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return dates


# =============================================
# Normalizers per scraper
# =============================================

def _normalize_garuda(flight: dict, run_id: str, route: str) -> dict:
    return {
        "run_id": run_id,
        "route": route,
        "airline": flight["airline"],
        "source": "garuda_api",
        "travel_date": datetime.strptime(flight["travel_date"], "%Y-%m-%d").date(),
        "flight_number": flight["flight_number"],
        "depart_time": flight["depart_time"],
        "arrive_time": flight["arrival_time"],
        "basic_fare": flight["total_fare"],
        "currency": "IDR",
        "scrape_source_page": URL_GARUDA,
        "source_type": "airline",
        "raw_price_label": flight.get("fare_family", ""),
        "status_scrape": "SUCCESS",
    }


def _normalize_citilink(flight: dict, run_id: str, route: str) -> dict:
    return {
        "run_id": run_id,
        "route": route,
        "airline": flight["airline"],
        "source": "citilink_api",
        "travel_date": datetime.strptime(flight["travel_date"], "%Y-%m-%d").date(),
        "flight_number": flight["flight_number"],
        "depart_time": flight["depart_time"],
        "arrive_time": flight["arrival_time"],
        "basic_fare": flight["fare_total"],
        "currency": "IDR",
        "scrape_source_page": URL_CITILINK,
        "source_type": "airline",
        "raw_price_label": "",
        "status_scrape": "SUCCESS",
    }


def _normalize_bookcabin(flight: dict, run_id: str, route: str) -> dict:
    return {
        "run_id": run_id,
        "route": route,
        "airline": flight["airline"],
        "source": "bookcabin_api",
        "travel_date": datetime.strptime(flight["travel_date"], "%Y-%m-%d").date(),
        "flight_number": flight["flight_number"],
        "depart_time": flight["depart_time"],
        "arrive_time": flight["arrival_time"],
        "basic_fare": flight["total_fare"],
        "currency": "IDR",
        "scrape_source_page": URL_BOOKCABIN,
        "source_type": "bookcabin",
        "raw_price_label": "",
        "status_scrape": "SUCCESS",
    }


# =============================================
# Mark lowest fares
# =============================================

def _mark_lowest_fares(records: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = {}
    for r in records:
        key = f"{r['airline']}|{r['travel_date']}"
        groups.setdefault(key, []).append(r)

    for group in groups.values():
        success = [r for r in group if r.get("status_scrape") == "SUCCESS"]
        if not success:
            continue
        min_fare = min(r["basic_fare"] for r in success)
        for r in group:
            r["is_lowest_fare"] = (r["basic_fare"] == min_fare and r.get("status_scrape") == "SUCCESS")

    return records


# =============================================
# Compute daily summary (data turunan)
# =============================================

def _compute_daily_summary(db: Session, run_id: str, route: str, scrape_dt: date):
    """Hitung agregasi harian dan simpan ke fare_daily_summary."""
    fares = db.query(FlightFare).filter(
        FlightFare.run_id == run_id,
        FlightFare.status_scrape == "SUCCESS",
    ).all()

    if not fares:
        return

    # Group by airline + travel_date
    groups: dict[str, list[FlightFare]] = {}
    for f in fares:
        key = f"{f.airline}|{f.travel_date}"
        groups.setdefault(key, []).append(f)

    # Group by travel_date only (untuk cheapest_airline_per_day)
    by_date: dict[date, list[FlightFare]] = {}
    for f in fares:
        by_date.setdefault(f.travel_date, []).append(f)

    # Hitung cheapest airline per date
    cheapest_airline_map: dict[date, str] = {}
    for td, date_fares in by_date.items():
        cheapest = min(date_fares, key=lambda x: float(x.basic_fare))
        cheapest_airline_map[td] = cheapest.airline

    # Hitung summary per airline + travel_date
    for key, group_fares in groups.items():
        airline = group_fares[0].airline
        travel_dt = group_fares[0].travel_date
        prices = [float(f.basic_fare) for f in group_fares]

        daily_min = min(prices)
        daily_max = max(prices)
        daily_avg = sum(prices) / len(prices)
        vol = statistics.stdev(prices) if len(prices) > 1 else 0.0

        # Price change DoD: bandingkan dengan scrape sebelumnya
        prev_summary = db.query(FareDailySummary).filter(
            FareDailySummary.route == route,
            FareDailySummary.airline == airline,
            FareDailySummary.travel_date == travel_dt,
            FareDailySummary.scrape_date < scrape_dt,
        ).order_by(FareDailySummary.scrape_date.desc()).first()

        dod = None
        if prev_summary and prev_summary.daily_min_price:
            dod = Decimal(str(daily_min)) - prev_summary.daily_min_price

        summary = FareDailySummary(
            route=route,
            airline=airline,
            travel_date=travel_dt,
            scrape_date=scrape_dt,
            daily_min_price=daily_min,
            daily_avg_price=round(daily_avg, 2),
            daily_max_price=daily_max,
            price_change_dod=dod,
            volatility=round(vol, 2),
            cheapest_airline_per_day=cheapest_airline_map.get(travel_dt, ""),
            cheapest_route_per_day=route,
        )
        db.add(summary)

        # GENERATE NOTIFICATION: Price Alert if drop > 5% and min_price > 0
        if dod and daily_min > 0:
            prev_price = float(prev_summary.daily_min_price)
            drop_percent = (float(abs(dod)) / prev_price) * 100
            if dod < 0 and drop_percent > 5:
                # Create notification
                notif = Notification(
                    type="price_alert",
                    title=f"Harga Turun: {route} ({airline})",
                    message=f"Tiket {airline} untuk {travel_dt.strftime('%d %b')} turun {drop_percent:.1f}% menjadi Rp {daily_min:,.0f}",
                    route=route,
                    price_change=float(dod),
                )
                db.add(notif)

    db.commit()


# =============================================
# Scrape one date (all airlines in parallel)
# =============================================

def _scrape_single_date(
    origin: str, destination: str, date_str: str,
    token: str | None, run_id: str, route: str,
) -> tuple[list[dict], int, bool]:
    """Scrape one date for all airlines. Returns (records, error_count, token_expired)."""

    normalizers = {
        "garuda_api": _normalize_garuda,
        "citilink_api": _normalize_citilink,
        "bookcabin_api": _normalize_bookcabin,
    }
    source_urls = {
        "garuda_api": URL_GARUDA,
        "citilink_api": URL_CITILINK,
        "bookcabin_api": URL_BOOKCABIN,
    }
    source_types = {
        "garuda_api": "airline",
        "citilink_api": "airline",
        "bookcabin_api": "bookcabin",
    }

    records: list[dict] = []
    errors = 0
    token_expired = False

    def _scrape_garuda_safe():
        try:
            flights = _scrape_retry(scrape_garuda)(origin, destination, date_str)
            return ("garuda_api", flights, None)
        except Exception as e:
            logger.warning("Garuda scrape failed for %s: %s", date_str, e)
            return ("garuda_api", [], str(e))

    def _scrape_citilink_safe():
        try:
            flights = _scrape_retry(scrape_citilink)(origin, destination, date_str, token)
            return ("citilink_api", flights, None)
        except Exception as e:
            err_str = str(e)
            logger.warning("Citilink scrape failed for %s: %s", date_str, e)
            return ("citilink_api", [], err_str)

    def _scrape_bookcabin_safe():
        try:
            flights = _scrape_retry(scrape_bookcabin)(origin, destination, date_str)
            return ("bookcabin_api", flights, None)
        except Exception as e:
            logger.warning("BookCabin scrape failed for %s: %s", date_str, e)
            return ("bookcabin_api", [], str(e))

    # Launch 3 scrapers in parallel for this date
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(_scrape_garuda_safe),
            executor.submit(_scrape_bookcabin_safe),
        ]
        if token:
            futures.append(executor.submit(_scrape_citilink_safe))

        for future in as_completed(futures):
            src, flights, error = future.result()

            if error:
                errors += 1
                if src == "citilink_api" and ("401" in error or "403" in error or "Unauthorized" in error):
                    token_expired = True
                records.append({
                    "run_id": run_id, "route": route, "airline": "-", "source": src,
                    "travel_date": datetime.strptime(date_str, "%Y-%m-%d").date(),
                    "flight_number": "-", "depart_time": "-", "arrive_time": "-",
                    "basic_fare": 0, "currency": "IDR",
                    "scrape_source_page": source_urls[src],
                    "source_type": source_types[src],
                    "status_scrape": "FAILED", "error_reason": error,
                })
            else:
                normalize_fn = normalizers[src]
                for f in flights:
                    records.append(normalize_fn(f, run_id, route))

    return records, errors, token_expired


# =============================================
# Main scrape orchestrator
# =============================================

def scrape_and_save(
    db: Session,
    origin: str,
    destination: str,
    start_date: date,
    end_date: date,
    citilink_token: str | None = None,
    run_type: str = "MANUAL",
    job_id: str | None = None,
    route_index: int = 0,
    total_routes: int = 1,
) -> dict:
    """Scrape semua tanggal, simpan ke DB, hitung summary.
    
    Now processes dates in concurrent batches of 5 for much faster execution.
    """

    run_id = str(uuid.uuid4())
    scrape_dt = date.today()
    route = f"{origin}-{destination}"
    token = citilink_token or settings.CITILINK_TOKEN
    dates = generate_dates(start_date, end_date)
    total_dates = len(dates)

    # 1. Buat ScrapeRun record
    run = ScrapeRun(
        run_id=run_id,
        run_type=run_type,
        scrape_date=scrape_dt,
        route=route,
        status="RUNNING",
    )
    db.add(run)
    db.commit()

    all_records: list[dict] = []
    total_errors = 0
    citilink_token_expired = False
    stats = {
        "garuda_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
        "citilink_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
        "bookcabin_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
    }

    # 2. Scrape dates in concurrent batches of 5
    BATCH_SIZE = 5
    dates_processed = 0

    for batch_start in range(0, total_dates, BATCH_SIZE):
        batch = dates[batch_start:batch_start + BATCH_SIZE]

        # Process batch of dates concurrently
        with ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
            future_to_date = {
                executor.submit(
                    _scrape_single_date, origin, destination, ds, token, run_id, route
                ): ds for ds in batch
            }

            for future in as_completed(future_to_date):
                ds = future_to_date[future]
                try:
                    records, err_count, tok_expired = future.result()
                    all_records.extend(records)
                    total_errors += err_count
                    if tok_expired:
                        citilink_token_expired = True

                    # Update per-source stats
                    for r in records:
                        src = r.get("source", "")
                        if src in stats:
                            if r.get("status_scrape") == "SUCCESS":
                                stats[src]["total_flights"] += 1
                            else:
                                stats[src]["errors"] += 1

                except Exception as e:
                    logger.error("Unexpected error scraping date %s: %s", ds, e)
                    total_errors += 3  # assume all 3 scrapers failed

                dates_processed += 1

                # Update progress if job_id provided
                if job_id:
                    overall_progress = (
                        (route_index * total_dates + dates_processed)
                        / (total_routes * total_dates)
                    ) * 100
                    _set_job_progress(job_id, {
                        "status": "RUNNING",
                        "progress": round(overall_progress, 1),
                        "current_route": route,
                        "route_index": route_index + 1,
                        "total_routes": total_routes,
                        "dates_processed": dates_processed,
                        "total_dates": total_dates,
                        "total_records": len(all_records),
                    })

        # Small delay between batches to be polite to APIs
        if batch_start + BATCH_SIZE < total_dates:
            time.sleep(settings.SCRAPE_DELAY)

    # Count dates per source
    for src in stats:
        src_dates = set()
        for r in all_records:
            if r.get("source") == src and r.get("status_scrape") == "SUCCESS":
                src_dates.add(r.get("travel_date"))
        stats[src]["total_dates"] = len(src_dates)

    # 3. Mark lowest fares
    if all_records:
        all_records = _mark_lowest_fares(all_records)

    # 4. Bulk insert flight_fares
    for r in all_records:
        db.add(FlightFare(**r))
    db.commit()

    # 5. Update ScrapeRun status
    run.status = "COMPLETED"
    run.total_records = len(all_records)
    run.total_errors = total_errors
    db.commit()

    # 6. Compute daily summary (data turunan)
    _compute_daily_summary(db, run_id, route, scrape_dt)

    # 7. NOTIFICATION: Scrape Completion
    if total_errors == 0:
        db.add(Notification(
            type="success",
            title=f"Scraping Selesai: {route}",
            message=f"Berhasil mengambil data {len(all_records)} penerbangan untuk rute {route}.",
            route=route
        ))
    else:
        db.add(Notification(
            type="warning",
            title=f"Scraping Selesai (Sebagian): {route}",
            message=f"Selesai dengan {total_errors} error. Berhasil mengambil {len(all_records)} data penerbangan.",
            route=route
        ))

    # 8. NOTIFICATION: Citilink token expired
    if citilink_token_expired:
        db.add(Notification(
            type="warning",
            title="Citilink Token Expired",
            message="Token Citilink tidak valid. Silakan update token di halaman Pengaturan.",
        ))

    # 9. NOTIFICATION: High error rate alert (> 50%)
    total_attempts = len(dates) * 3  # 3 scrapers per date
    if total_attempts > 0 and (total_errors / total_attempts) > 0.5:
        db.add(Notification(
            type="system",
            title=f"Error Rate Tinggi: {route}",
            message=f"Error rate {(total_errors/total_attempts)*100:.0f}% ({total_errors}/{total_attempts}). Periksa koneksi atau konfigurasi scraper.",
            route=route,
        ))

    db.commit()

    return {
        "run_id": run_id,
        "route": route,
        "start_date": start_date,
        "end_date": end_date,
        "run_type": run_type,
        "total_records": len(all_records),
        "stats": [
            {"source": src, **data} for src, data in stats.items()
        ],
    }


# =============================================
# Background bulk-routes orchestrator
# =============================================

def run_bulk_routes_background(
    job_id: str,
    routes: list[dict],  # [{"origin": "BTH", "destination": "CGK"}, ...]
    start_date: date,
    end_date: date,
    citilink_token: str | None = None,
    run_type: str = "MANUAL",
):
    """Run bulk-routes scraping in a background thread with progress tracking."""
    db = SessionLocal()
    try:
        results = []
        total_records = 0
        total_routes = len(routes)

        _set_job_progress(job_id, {
            "status": "RUNNING",
            "progress": 0,
            "current_route": "",
            "route_index": 0,
            "total_routes": total_routes,
            "dates_processed": 0,
            "total_dates": 0,
            "total_records": 0,
        })

        for i, route_cfg in enumerate(routes):
            origin = route_cfg["origin"]
            destination = route_cfg["destination"]

            result = scrape_and_save(
                db=db,
                origin=origin,
                destination=destination,
                start_date=start_date,
                end_date=end_date,
                citilink_token=citilink_token,
                run_type=run_type,
                job_id=job_id,
                route_index=i,
                total_routes=total_routes,
            )
            results.append(result)
            total_records += result["total_records"]

        # Final progress
        _set_job_progress(job_id, {
            "status": "COMPLETED",
            "progress": 100,
            "current_route": "",
            "route_index": total_routes,
            "total_routes": total_routes,
            "dates_processed": 0,
            "total_dates": 0,
            "total_records": total_records,
            "results": results,
        })

    except Exception as e:
        logger.error("Bulk routes background job failed: %s", e)
        _set_job_progress(job_id, {
            "status": "FAILED",
            "progress": 0,
            "error": str(e),
            "total_records": 0,
        })
    finally:
        db.close()
        # Cleanup job data after 5 minutes
        _cleanup_job(job_id, delay=300)
