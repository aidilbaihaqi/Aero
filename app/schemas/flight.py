from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# =============================================
# Response: ScrapeRun
# =============================================

class ScrapeRunOut(BaseModel):
    id: int
    run_id: str
    run_type: str
    scraped_at: Optional[datetime] = None
    scrape_date: date
    route: str
    status: str
    total_records: int
    total_errors: int

    class Config:
        from_attributes = True


# =============================================
# Response: FlightFare
# =============================================

class FlightFareOut(BaseModel):
    id: int
    run_id: str
    route: str
    airline: str
    source: str
    travel_date: date
    flight_number: str
    depart_time: str
    arrive_time: str
    basic_fare: Decimal
    currency: str = "IDR"
    scrape_source_page: Optional[str] = None
    source_type: str
    raw_price_label: Optional[str] = None
    status_scrape: str = "SUCCESS"
    error_reason: Optional[str] = None
    is_lowest_fare: bool = False

    class Config:
        from_attributes = True


# =============================================
# Response: FareDailySummary
# =============================================

class FareDailySummaryOut(BaseModel):
    id: int
    route: str
    airline: str
    travel_date: date
    scrape_date: date
    daily_min_price: Optional[Decimal] = None
    daily_avg_price: Optional[Decimal] = None
    daily_max_price: Optional[Decimal] = None
    price_change_dod: Optional[Decimal] = None
    volatility: Optional[float] = None
    cheapest_airline_per_day: Optional[str] = None
    cheapest_route_per_day: Optional[str] = None

    class Config:
        from_attributes = True


# =============================================
# Requests
# =============================================

class ScrapeRequest(BaseModel):
    origin: str = Field(default="BTH")
    destination: str = Field(default="CGK")
    start_date: date
    end_date: date
    citilink_token: Optional[str] = Field(default=None)
    run_type: str = Field(default="MANUAL")


class ExportRequest(BaseModel):
    origin: str = Field(default="BTH")
    destination: str = Field(default="CGK")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    scrape_date: Optional[date] = Field(default=None)


# =============================================
# Response Wrappers
# =============================================

class ScrapeStats(BaseModel):
    source: str
    total_flights: int
    total_dates: int
    errors: int


class ScrapeResponse(BaseModel):
    run_id: str
    route: str
    start_date: date
    end_date: date
    run_type: str
    total_records: int
    stats: list[ScrapeStats]
