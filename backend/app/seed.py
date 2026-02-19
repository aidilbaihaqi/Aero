"""
seed.py — Create default admin user.

Usage:
    cd backend
    python -m app.seed
"""

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.flight import ScrapeRun, FlightFare, FareDailySummary  # noqa: ensure all tables created
from app.services.auth_service import hash_password


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if admin already exists
        existing = db.query(User).filter(User.email == "admin@aeroprice.com").first()
        if existing:
            print("✅ Admin user sudah ada, skip.")
            return

        admin = User(
            email="admin@aeroprice.com",
            name="Admin",
            hashed_password=hash_password("admin123"),
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print("✅ Admin user berhasil dibuat!")
        print("   Email   : admin@aeroprice.com")
        print("   Password: admin123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
