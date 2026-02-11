from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Numeric, Boolean, Text,
    Index,
)
from sqlalchemy.sql import func

from app.database import Base


class FlightFare(Base):
    __tablename__ = "flight_fares"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # --- Data Primer ---
    route = Column(String(10), nullable=False)               # "BTH-CGK"
    airline = Column(String(50), nullable=False)              # "GARUDA INDONESIA"
    source = Column(String(30), nullable=False)               # "garuda_api" / "citilink_api" / "bookcabin_api"
    travel_date = Column(Date, nullable=False)                # tanggal terbang
    flight_number = Column(String(10), nullable=False)        # "GA157"
    depart_time = Column(String(5), nullable=False)           # "17:40"
    arrive_time = Column(String(5), nullable=False)           # "19:30"
    basic_fare = Column(Numeric(15, 2), nullable=False)       # harga total
    currency = Column(String(3), default="IDR")

    # --- Data Meta ---
    scraped_at = Column(DateTime, server_default=func.now())  # timestamp pengambilan
    scrape_date = Column(Date, nullable=False)                # tanggal pengamatan (dimensi time-series)
    scrape_source_page = Column(String(100))                  # URL endpoint
    error_reason = Column(Text)                               # null jika sukses
    run_id = Column(String(50), nullable=False)               # UUID per scrape run
    run_type = Column(String(10), default="MANUAL")           # SCHEDULED / MANUAL
    source_type = Column(String(15), nullable=False)          # "airline" / "bookcabin"
    raw_price_label = Column(String(50))                      # fare family / class label
    status_scrape = Column(String(10), default="SUCCESS")     # SUCCESS / FAILED
    is_lowest_fare = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_flight_fares_route_date", "route", "travel_date"),
        Index("idx_flight_fares_scrape_date", "scrape_date"),
        Index("idx_flight_fares_run_id", "run_id"),
    )

    def __repr__(self):
        return f"<FlightFare {self.flight_number} {self.route} {self.travel_date} {self.basic_fare}>"
