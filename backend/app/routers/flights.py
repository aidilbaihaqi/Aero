"""
flights.py — API endpoints untuk flight scraping.
"""

import uuid
import threading
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.flight import FlightFare, ScrapeRun, FareDailySummary
from app.schemas.flight import (
    FlightFareOut, ScrapeRunOut, FareDailySummaryOut,
    ScrapeRequest, ScrapeResponse, ExportRequest,
    BulkRoutesRequest, BulkRoutesResponse, RouteItem,
)
from app.services.scraper_service import scrape_and_save, run_bulk_routes_background, get_job_progress
from app.services.export_service import export_triangle_xlsx
from app.services.auth_service import get_current_user
from app.models.user import User
from app.config import settings

router = APIRouter(prefix="/api/flights", tags=["Flights"])


# =============================================
# Scraping
# =============================================

@router.get("/search", response_model=ScrapeResponse)
def search_flights(
    origin: str = Query(default="BTH"),
    destination: str = Query(default="CGK"),
    date: str = Query(description="Tanggal terbang (YYYY-MM-DD)"),
    citilink_token: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Scrape penerbangan untuk 1 tanggal, simpan ke DB."""
    d = __import__("datetime").date.fromisoformat(date)
    return scrape_and_save(db=db, origin=origin, destination=destination,
                           start_date=d, end_date=d, citilink_token=citilink_token)


@router.post("/bulk", response_model=ScrapeResponse)
def bulk_scrape(req: ScrapeRequest, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    """Scrape penerbangan untuk 1 rute, range tanggal. (Protected)"""
    return scrape_and_save(db=db, origin=req.origin, destination=req.destination,
                           start_date=req.start_date, end_date=req.end_date,
                           citilink_token=req.citilink_token, run_type=req.run_type)


@router.post("/bulk-routes")
def bulk_routes_scrape(req: BulkRoutesRequest, _user: User = Depends(get_current_user)):
    """Scrape beberapa rute sekaligus (background task).
    
    Langsung return job_id, scraping berjalan di background thread.
    Gunakan GET /api/flights/scrape-progress/{job_id} untuk polling progress.
    """
    # Resolve routes
    routes = req.routes
    if not routes:
        routes = [RouteItem(**r) for r in settings.DEFAULT_ROUTES]

    job_id = str(uuid.uuid4())
    routes_dicts = [{"origin": r.origin, "destination": r.destination} for r in routes]

    # Launch background thread
    thread = threading.Thread(
        target=run_bulk_routes_background,
        args=(job_id, routes_dicts, req.start_date, req.end_date, req.citilink_token, req.run_type),
        daemon=True,
    )
    thread.start()

    return {
        "job_id": job_id,
        "status": "STARTED",
        "total_routes": len(routes),
        "message": "Scraping dimulai di background. Gunakan /api/flights/scrape-progress/{job_id} untuk cek progress."
    }


@router.get("/scrape-progress/{job_id}")
def get_scrape_progress(job_id: str):
    """Polling endpoint untuk progress scraping background."""
    progress = get_job_progress(job_id)
    if progress is None:
        raise HTTPException(status_code=404, detail="Job not found or already expired.")
    return progress


# =============================================
# Export
# =============================================

@router.post("/export")
def export_xlsx(req: ExportRequest, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    """Export data dari DB ke XLSX format segitiga."""
    filepath = export_triangle_xlsx(db=db, origin=req.origin, destination=req.destination,
                                     start_date=req.start_date, end_date=req.end_date,
                                     scrape_date_filter=req.scrape_date)
    if not filepath:
        return {"error": "Tidak ada data ditemukan."}
    return FileResponse(path=filepath,
                        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        filename=filepath.split("\\")[-1].split("/")[-1])


# =============================================
# History — Flight Fares (Data Primer)
# =============================================

@router.get("/history", response_model=list[FlightFareOut])
def get_history(
    route: Optional[str] = Query(default=None),
    airline: Optional[str] = Query(default=None),
    travel_date_from: Optional[date] = Query(default=None),
    travel_date_to: Optional[date] = Query(default=None),
    run_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Query riwayat harga penerbangan dari database."""
    query = db.query(FlightFare).filter(FlightFare.status_scrape == "SUCCESS")
    if route:
        query = query.filter(FlightFare.route == route)
    if airline:
        query = query.filter(FlightFare.airline.ilike(f"%{airline}%"))
    if travel_date_from:
        query = query.filter(FlightFare.travel_date >= travel_date_from)
    if travel_date_to:
        query = query.filter(FlightFare.travel_date <= travel_date_to)
    if run_id:
        query = query.filter(FlightFare.run_id == run_id)
    return query.order_by(FlightFare.travel_date, FlightFare.basic_fare).offset(offset).limit(limit).all()


# =============================================
# Runs — Scrape Runs (Data Meta)
# =============================================

@router.get("/runs", response_model=list[ScrapeRunOut])
def get_runs(
    route: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    """List semua scrape runs."""
    query = db.query(ScrapeRun)
    if route:
        query = query.filter(ScrapeRun.route == route)
    if status:
        query = query.filter(ScrapeRun.status == status)
    return query.order_by(ScrapeRun.scraped_at.desc()).limit(limit).all()


@router.get("/runs/{run_id}", response_model=ScrapeRunOut)
def get_run_detail(run_id: str, db: Session = Depends(get_db)):
    """Detail 1 scrape run."""
    return db.query(ScrapeRun).filter(ScrapeRun.run_id == run_id).first()


# =============================================
# Summary — Data Turunan
# =============================================

@router.get("/summary", response_model=list[FareDailySummaryOut])
def get_daily_summary(
    route: Optional[str] = Query(default=None),
    airline: Optional[str] = Query(default=None),
    travel_date_from: Optional[date] = Query(default=None),
    travel_date_to: Optional[date] = Query(default=None),
    scrape_date: Optional[date] = Query(default=None),
    limit: int = Query(default=100, le=1000),
    db: Session = Depends(get_db),
):
    """Query data turunan: min/avg/max/DoD/volatility per hari."""
    query = db.query(FareDailySummary)
    if route:
        query = query.filter(FareDailySummary.route == route)
    if airline:
        query = query.filter(FareDailySummary.airline.ilike(f"%{airline}%"))
    if travel_date_from:
        query = query.filter(FareDailySummary.travel_date >= travel_date_from)
    if travel_date_to:
        query = query.filter(FareDailySummary.travel_date <= travel_date_to)
    if scrape_date:
        query = query.filter(FareDailySummary.scrape_date == scrape_date)
    return query.order_by(FareDailySummary.travel_date, FareDailySummary.airline).limit(limit).all()
