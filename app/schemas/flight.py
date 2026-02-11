from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# =============================================
# Response Models
# =============================================

class FlightFareOut(BaseModel):
    """Representasi 1 record penerbangan dari database."""
    id: int
    route: str
    airline: str
    source: str
    travel_date: date
    flight_number: str
    depart_time: str
    arrive_time: str
    basic_fare: Decimal
    currency: str = "IDR"

    scraped_at: Optional[datetime] = None
    scrape_date: date
    scrape_source_page: Optional[str] = None
    error_reason: Optional[str] = None
    run_id: str
    run_type: str = "MANUAL"
    source_type: str
    raw_price_label: Optional[str] = None
    status_scrape: str = "SUCCESS"
    is_lowest_fare: bool = False

    class Config:
        from_attributes = True


# =============================================
# Request Models
# =============================================

class ScrapeRequest(BaseModel):
    """Input untuk scrape penerbangan."""
    origin: str = Field(default="BTH", description="Kode bandara asal")
    destination: str = Field(default="CGK", description="Kode bandara tujuan")
    start_date: date = Field(description="Tanggal mulai (YYYY-MM-DD)")
    end_date: date = Field(description="Tanggal akhir (YYYY-MM-DD)")
    citilink_token: Optional[str] = Field(default=None, description="JWT token Citilink (opsional, fallback ke .env)")
    run_type: str = Field(default="MANUAL", description="MANUAL atau SCHEDULED")


class ExportRequest(BaseModel):
    """Input untuk export XLSX."""
    origin: str = Field(default="BTH")
    destination: str = Field(default="CGK")
    start_date: date = Field(description="Tanggal mulai data")
    end_date: date = Field(description="Tanggal akhir data")
    scrape_date: Optional[date] = Field(default=None, description="Filter scrape_date tertentu (opsional)")


# =============================================
# Response Wrappers
# =============================================

class ScrapeStats(BaseModel):
    """Statistik per sumber scraping."""
    source: str
    total_flights: int
    total_dates: int
    errors: int


class ScrapeResponse(BaseModel):
    """Response setelah bulk scrape."""
    run_id: str
    route: str
    start_date: date
    end_date: date
    run_type: str
    total_records: int
    stats: list[ScrapeStats]


class HistoryQuery(BaseModel):
    """Query parameters untuk history (digunakan sebagai query params)."""
    route: Optional[str] = None
    airline: Optional[str] = None
    travel_date_from: Optional[date] = None
    travel_date_to: Optional[date] = None
    scrape_date: Optional[date] = None
    limit: int = Field(default=100, le=1000)
    offset: int = Field(default=0, ge=0)
