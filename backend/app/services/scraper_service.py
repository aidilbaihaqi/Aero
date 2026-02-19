"""
scraper_service.py — Orchestrate scraping dan simpan ke database (3-table structure).
"""

import time
import uuid
import statistics
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.models.flight import ScrapeRun, FlightFare, FareDailySummary
from app.models.notification import Notification
from app.scrapers.garuda import scrape_garuda, URL_GARUDA
from app.scrapers.citilink import scrape_citilink, URL_CITILINK
from app.scrapers.bookcabin import scrape_bookcabin, URL_BOOKCABIN


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
) -> dict:
    """Scrape semua tanggal, simpan ke DB, hitung summary."""

    run_id = str(uuid.uuid4())
    scrape_dt = date.today()
    route = f"{origin}-{destination}"
    token = citilink_token or settings.CITILINK_TOKEN
    dates = generate_dates(start_date, end_date)

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
    stats = {
        "garuda_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
        "citilink_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
        "bookcabin_api": {"total_flights": 0, "total_dates": 0, "errors": 0},
    }

    # 2. Scrape per tanggal (3 airlines in PARALLEL per date)
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def _scrape_garuda_safe(date_str):
        try:
            flights = scrape_garuda(origin, destination, date_str)
            return ("garuda_api", date_str, flights, None)
        except Exception as e:
            return ("garuda_api", date_str, [], str(e))

    def _scrape_citilink_safe(date_str):
        try:
            flights = scrape_citilink(origin, destination, date_str, token)
            return ("citilink_api", date_str, flights, None)
        except Exception as e:
            return ("citilink_api", date_str, [], str(e))

    def _scrape_bookcabin_safe(date_str):
        try:
            flights = scrape_bookcabin(origin, destination, date_str)
            return ("bookcabin_api", date_str, flights, None)
        except Exception as e:
            return ("bookcabin_api", date_str, [], str(e))

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

    for date_str in dates:
        # Launch 3 scrapers in parallel
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [
                executor.submit(_scrape_garuda_safe, date_str),
                executor.submit(_scrape_bookcabin_safe, date_str),
            ]
            if token:
                futures.append(executor.submit(_scrape_citilink_safe, date_str))

            for future in as_completed(futures):
                src, ds, flights, error = future.result()

                if error:
                    stats[src]["errors"] += 1
                    total_errors += 1
                    all_records.append({
                        "run_id": run_id, "route": route, "airline": "-", "source": src,
                        "travel_date": datetime.strptime(ds, "%Y-%m-%d").date(),
                        "flight_number": "-", "depart_time": "-", "arrive_time": "-",
                        "basic_fare": 0, "currency": "IDR",
                        "scrape_source_page": source_urls[src],
                        "source_type": source_types[src],
                        "status_scrape": "FAILED", "error_reason": error,
                    })
                else:
                    normalize_fn = normalizers[src]
                    for f in flights:
                        all_records.append(normalize_fn(f, run_id, route))
                    stats[src]["total_flights"] += len(flights)
                    if flights:
                        stats[src]["total_dates"] += 1

        # 1 delay per date batch (not per scraper)
        time.sleep(settings.SCRAPE_DELAY)

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
