"""
flights.py — API endpoints untuk flight scraping.
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.flight import FlightFare
from app.schemas.flight import (
    FlightFareOut, ScrapeRequest, ScrapeResponse, ExportRequest,
)
from app.services.scraper_service import scrape_and_save
from app.services.export_service import export_triangle_xlsx

router = APIRouter(prefix="/api/flights", tags=["Flights"])


# =============================================
# GET /api/flights/search — Scrape 1 tanggal
# =============================================
@router.get("/search", response_model=ScrapeResponse)
def search_flights(
    origin: str = Query(default="BTH"),
    destination: str = Query(default="CGK"),
    date: str = Query(description="Tanggal terbang (YYYY-MM-DD)"),
    citilink_token: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Scrape penerbangan untuk 1 tanggal, simpan ke DB, return summary."""
    d = __import__("datetime").date.fromisoformat(date)
    result = scrape_and_save(
        db=db,
        origin=origin,
        destination=destination,
        start_date=d,
        end_date=d,
        citilink_token=citilink_token,
        run_type="MANUAL",
    )
    return result


# =============================================
# POST /api/flights/bulk — Scrape range tanggal
# =============================================
@router.post("/bulk", response_model=ScrapeResponse)
def bulk_scrape(req: ScrapeRequest, db: Session = Depends(get_db)):
    """Scrape penerbangan untuk range tanggal, simpan ke DB, return summary."""
    result = scrape_and_save(
        db=db,
        origin=req.origin,
        destination=req.destination,
        start_date=req.start_date,
        end_date=req.end_date,
        citilink_token=req.citilink_token,
        run_type=req.run_type,
    )
    return result


# =============================================
# POST /api/flights/export — Export XLSX triangle
# =============================================
@router.post("/export")
def export_xlsx(req: ExportRequest, db: Session = Depends(get_db)):
    """Export data dari DB ke file XLSX format segitiga, return file download."""
    filepath = export_triangle_xlsx(
        db=db,
        origin=req.origin,
        destination=req.destination,
        start_date=req.start_date,
        end_date=req.end_date,
        scrape_date_filter=req.scrape_date,
    )
    if not filepath:
        return {"error": "Tidak ada data ditemukan untuk filter ini."}

    return FileResponse(
        path=filepath,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filepath.split("\\")[-1].split("/")[-1],
    )


# =============================================
# GET /api/flights/history — Query riwayat harga
# =============================================
@router.get("/history", response_model=list[FlightFareOut])
def get_history(
    route: Optional[str] = Query(default=None, description="e.g. BTH-CGK"),
    airline: Optional[str] = Query(default=None),
    travel_date_from: Optional[date] = Query(default=None),
    travel_date_to: Optional[date] = Query(default=None),
    scrape_date: Optional[date] = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Query riwayat harga dari database dengan berbagai filter."""
    query = db.query(FlightFare)

    if route:
        query = query.filter(FlightFare.route == route)
    if airline:
        query = query.filter(FlightFare.airline.ilike(f"%{airline}%"))
    if travel_date_from:
        query = query.filter(FlightFare.travel_date >= travel_date_from)
    if travel_date_to:
        query = query.filter(FlightFare.travel_date <= travel_date_to)
    if scrape_date:
        query = query.filter(FlightFare.scrape_date == scrape_date)

    records = query.order_by(
        FlightFare.travel_date, FlightFare.airline, FlightFare.basic_fare
    ).offset(offset).limit(limit).all()

    return records
