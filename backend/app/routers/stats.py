"""
stats.py — Aggregated statistics endpoints for dashboard & analytics.
"""

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, distinct, case, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.flight import FlightFare, ScrapeRun, FareDailySummary

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db)):
    """Aggregated stats for the dashboard page."""
    today = date.today()
    month_start = today.replace(day=1)

    # Route count (distinct routes)
    route_count = db.query(func.count(distinct(FlightFare.route))).scalar() or 0

    # Airline count
    airline_count = db.query(func.count(distinct(FlightFare.airline))).scalar() or 0

    # Runs this month
    runs_this_month = (
        db.query(func.count(ScrapeRun.id))
        .filter(ScrapeRun.scrape_date >= month_start)
        .scalar()
    ) or 0

    # Error count this month
    error_count = (
        db.query(func.count(ScrapeRun.id))
        .filter(ScrapeRun.scrape_date >= month_start, ScrapeRun.status == "FAILED")
        .scalar()
    ) or 0

    # Last scrape run
    last_run = db.query(ScrapeRun).order_by(desc(ScrapeRun.scraped_at)).first()
    last_scrape_time = last_run.scraped_at.isoformat() if last_run and last_run.scraped_at else None
    last_scrape_status = last_run.status if last_run else None

    # Average price (all successful fares)
    avg_price = (
        db.query(func.avg(FlightFare.basic_fare))
        .filter(FlightFare.status_scrape == "SUCCESS")
        .scalar()
    )
    avg_price = float(avg_price) if avg_price else 0

    # Best deal (cheapest fare)
    best = (
        db.query(FlightFare)
        .filter(FlightFare.status_scrape == "SUCCESS")
        .order_by(FlightFare.basic_fare.asc())
        .first()
    )
    best_deal = None
    if best:
        best_deal = {
            "route": best.route,
            "airline": best.airline,
            "price": float(best.basic_fare),
            "flight_number": best.flight_number,
            "travel_date": best.travel_date.isoformat(),
        }

    # Route performance — cheapest and most volatile
    cheapest_route = (
        db.query(
            FlightFare.route,
            func.avg(FlightFare.basic_fare).label("avg_price"),
        )
        .filter(FlightFare.status_scrape == "SUCCESS")
        .group_by(FlightFare.route)
        .order_by(func.avg(FlightFare.basic_fare).asc())
        .first()
    )

    most_volatile = (
        db.query(
            FareDailySummary.route,
            func.avg(FareDailySummary.volatility).label("avg_vol"),
        )
        .filter(FareDailySummary.volatility.isnot(None))
        .group_by(FareDailySummary.route)
        .order_by(desc(func.avg(FareDailySummary.volatility)))
        .first()
    )

    return {
        "route_count": route_count,
        "airline_count": airline_count,
        "runs_this_month": runs_this_month,
        "error_count": error_count,
        "last_scrape_time": last_scrape_time,
        "last_scrape_status": last_scrape_status,
        "avg_price": avg_price,
        "best_deal": best_deal,
        "cheapest_route": {
            "route": cheapest_route[0],
            "avg_price": float(cheapest_route[1]),
        } if cheapest_route else None,
        "most_volatile": {
            "route": most_volatile[0],
            "avg_volatility": float(most_volatile[1]),
        } if most_volatile else None,
    }


@router.get("/chart")
def price_chart(
    days: int = Query(default=7, le=90),
    db: Session = Depends(get_db),
):
    """Average price per day for the price trend chart."""
    cutoff = date.today() - timedelta(days=days)

    rows = (
        db.query(
            FlightFare.travel_date,
            func.avg(FlightFare.basic_fare).label("avg_price"),
        )
        .filter(
            FlightFare.status_scrape == "SUCCESS",
            FlightFare.travel_date >= cutoff,
        )
        .group_by(FlightFare.travel_date)
        .order_by(FlightFare.travel_date)
        .all()
    )

    day_names = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

    return [
        {
            "day": day_names[row.travel_date.weekday()],
            "date": row.travel_date.isoformat(),
            "price": round(float(row.avg_price)),
        }
        for row in rows
    ]


@router.get("/analytics")
def analytics_stats(
    days: int = Query(default=30, le=90),
    db: Session = Depends(get_db),
):
    """Aggregated analytics: price trends, airline comparison, key metrics."""
    cutoff = date.today() - timedelta(days=days)

    # Key metrics
    metrics = (
        db.query(
            func.min(FlightFare.basic_fare).label("min_price"),
            func.avg(FlightFare.basic_fare).label("avg_price"),
            func.max(FlightFare.basic_fare).label("max_price"),
        )
        .filter(
            FlightFare.status_scrape == "SUCCESS",
            FlightFare.travel_date >= cutoff,
        )
        .first()
    )

    # Price trend over time (grouped by travel_date)
    trend_rows = (
        db.query(
            FlightFare.travel_date,
            func.avg(FlightFare.basic_fare).label("avg_price"),
            func.min(FlightFare.basic_fare).label("min_price"),
            func.max(FlightFare.basic_fare).label("max_price"),
        )
        .filter(
            FlightFare.status_scrape == "SUCCESS",
            FlightFare.travel_date >= cutoff,
        )
        .group_by(FlightFare.travel_date)
        .order_by(FlightFare.travel_date)
        .all()
    )

    price_trend = [
        {
            "date": f"{row.travel_date.day} {row.travel_date.strftime('%b')}",
            "avgPrice": round(float(row.avg_price)),
            "minPrice": round(float(row.min_price)),
            "maxPrice": round(float(row.max_price)),
        }
        for row in trend_rows
    ]

    # Airline comparison
    airline_rows = (
        db.query(
            FlightFare.airline,
            func.avg(FlightFare.basic_fare).label("avg_price"),
            func.count(FlightFare.id).label("flight_count"),
        )
        .filter(
            FlightFare.status_scrape == "SUCCESS",
            FlightFare.travel_date >= cutoff,
        )
        .group_by(FlightFare.airline)
        .order_by(func.avg(FlightFare.basic_fare))
        .all()
    )

    airline_comparison = [
        {
            "airline": row.airline,
            "avgPrice": round(float(row.avg_price)),
            "flightCount": row.flight_count,
        }
        for row in airline_rows
    ]

    return {
        "min_price": float(metrics.min_price) if metrics and metrics.min_price else 0,
        "avg_price": float(metrics.avg_price) if metrics and metrics.avg_price else 0,
        "max_price": float(metrics.max_price) if metrics and metrics.max_price else 0,
        "price_trend": price_trend,
        "airline_comparison": airline_comparison,
    }


@router.get("/search")
def search_flights(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
):
    """Search for routes, airlines, or flights."""
    query = q.lower()
    results = []

    # 1. Search Routes
    routes = (
        db.query(distinct(FlightFare.route))
        .filter(FlightFare.route.ilike(f"%{query}%"))
        .limit(5)
        .all()
    )
    for r in routes:
        route_code = r[0]
        origin, dest = route_code.split("-") if "-" in route_code else (route_code, "")
        results.append({
            "id": f"route-{route_code}",
            "type": "route",
            "title": route_code.replace("-", " → "),
            "subtitle": "Rute Penerbangan",
            "url": f"/dashboard?route={route_code}",
        })

    # 2. Search Airlines
    airlines = (
        db.query(distinct(FlightFare.airline))
        .filter(FlightFare.airline.ilike(f"%{query}%"))
        .limit(5)
        .all()
    )
    for a in airlines:
        airline_name = a[0]
        results.append({
            "id": f"airline-{airline_name}",
            "type": "airline",
            "title": airline_name,
            "subtitle": "Maskapai",
            "url": f"/analytics?airline={airline_name.lower()}",
        })

    # 3. Search Flight Numbers
    flights = (
        db.query(distinct(FlightFare.flight_number), FlightFare.airline, FlightFare.route)
        .filter(FlightFare.flight_number.ilike(f"%{query}%"))
        .limit(5)
        .all()
    )
    for f in flights:
        f_num, f_airline, f_route = f
        results.append({
            "id": f"flight-{f_num}",
            "type": "flight",
            "title": f_num,
            "subtitle": f"{f_airline} • {f_route}",
            "url": f"/dashboard?search={f_num}",
        })

    return results
