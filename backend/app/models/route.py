"""Route model — persistent storage for flight routes to scrape."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


# Indonesian airport codes with city names
INDONESIA_AIRPORTS = {
    "BTH": "Batam",
    "CGK": "Jakarta (Soekarno-Hatta)",
    "HLP": "Jakarta (Halim)",
    "SUB": "Surabaya",
    "KNO": "Medan",
    "DPS": "Bali (Denpasar)",
    "UPG": "Makassar",
    "JOG": "Yogyakarta (Adisucipto)",
    "YIA": "Yogyakarta (YIA)",
    "BDO": "Bandung",
    "SOC": "Solo",
    "SRG": "Semarang",
    "PDG": "Padang",
    "PKU": "Pekanbaru",
    "BPN": "Balikpapan",
    "PLM": "Palembang",
    "PNK": "Pontianak",
    "MDC": "Manado",
    "BDJ": "Banjarmasin",
    "AMQ": "Ambon",
    "DJB": "Jambi",
    "TKG": "Bandar Lampung",
    "BKS": "Bengkulu",
    "TNJ": "Tanjung Pinang",
    "KDI": "Kendari",
    "LOP": "Lombok",
    "SOQ": "Sorong",
    "DJJ": "Jayapura",
    "TRK": "Tarakan",
    "GTO": "Gorontalo",
}


class Route(Base):
    """Flight routes to be scraped."""
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    origin = Column(String(5), nullable=False)
    destination = Column(String(5), nullable=False)
    origin_city = Column(String(50), nullable=False, default="")
    destination_city = Column(String(50), nullable=False, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("origin", "destination", name="uq_route_origin_dest"),
    )
