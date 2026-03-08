"""Routes router — CRUD for flight routes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.route import Route, INDONESIA_AIRPORTS
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/routes", tags=["Routes"])


# --- Schemas ---

class RouteCreate(BaseModel):
    origin: str
    destination: str


class RouteOut(BaseModel):
    id: int
    origin: str
    destination: str
    origin_city: str
    destination_city: str
    is_active: bool

    class Config:
        from_attributes = True


class AirportOut(BaseModel):
    code: str
    city: str


# --- Endpoints ---

@router.get("", response_model=list[RouteOut])
def list_routes(db: Session = Depends(get_db)):
    """List all active routes."""
    return db.query(Route).filter(Route.is_active == True).order_by(Route.id).all()


@router.post("", response_model=RouteOut)
def create_route(
    body: RouteCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Add a new route."""
    origin = body.origin.upper().strip()
    destination = body.destination.upper().strip()

    if origin == destination:
        raise HTTPException(status_code=400, detail="Origin dan destination tidak boleh sama.")

    if origin not in INDONESIA_AIRPORTS:
        raise HTTPException(status_code=400, detail=f"Kode bandara origin '{origin}' tidak valid.")
    if destination not in INDONESIA_AIRPORTS:
        raise HTTPException(status_code=400, detail=f"Kode bandara destination '{destination}' tidak valid.")

    # Check duplicate
    existing = db.query(Route).filter(
        Route.origin == origin,
        Route.destination == destination,
    ).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=409, detail="Rute sudah ada.")
        # Reactivate
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    route = Route(
        origin=origin,
        destination=destination,
        origin_city=INDONESIA_AIRPORTS.get(origin, ""),
        destination_city=INDONESIA_AIRPORTS.get(destination, ""),
    )
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


@router.delete("/{route_id}")
def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Soft-delete a route (set is_active=False)."""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Rute tidak ditemukan.")
    route.is_active = False
    db.commit()
    return {"status": "ok", "message": f"Rute {route.origin}-{route.destination} dihapus."}


@router.get("/airports", response_model=list[AirportOut])
def list_airports():
    """List all available Indonesian airports."""
    return [
        AirportOut(code=code, city=city)
        for code, city in sorted(INDONESIA_AIRPORTS.items(), key=lambda x: x[1])
    ]
