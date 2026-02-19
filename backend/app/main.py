"""
Aero — Flight Price Scraper API

FastAPI application entry point.
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import flights, auth, stats, settings, notifications, scheduler
from app.models.user import User  # noqa: ensure users table is created
from app.services.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup, start scheduler."""
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Aero — Flight Price Scraper API",
    description="Scraper harga tiket pesawat dari berbagai sumber API untuk rute domestik Indonesia.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(flights.router)
app.include_router(stats.router)
app.include_router(settings.router)
app.include_router(notifications.router)
app.include_router(scheduler.router)


@app.get("/")
def root():
    return {
        "app": "Aero Flight Price Scraper",
        "version": "1.0.0",
        "docs": "/docs",
    }
