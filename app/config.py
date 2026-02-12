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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
