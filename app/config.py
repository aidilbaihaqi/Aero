from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/aero"

    # Citilink JWT token (update via .env)
    CITILINK_TOKEN: str = ""

    # Scraping
    SCRAPE_DELAY: float = 0.5
    DEFAULT_ORIGIN: str = "BTH"
    DEFAULT_DESTINATION: str = "CGK"
    DEFAULT_END_DATE: str = "2026-03-31"

    # Rute default yang wajib di-scrape
    DEFAULT_ROUTES: list[dict] = [
        {"origin": "BTH", "destination": "CGK"},
        {"origin": "BTH", "destination": "KNO"},
        {"origin": "BTH", "destination": "SUB"},
        {"origin": "BTH", "destination": "PDG"},
        {"origin": "TNJ", "destination": "CGK"},
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
