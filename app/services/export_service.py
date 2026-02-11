"""
export_service.py — Export data dari database ke XLSX format segitiga.
"""

import os
from datetime import date

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.flight import FlightFare


EXPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "exports")


def _ensure_exports_dir():
    os.makedirs(EXPORTS_DIR, exist_ok=True)


def _sanitize_sheet_name(name: str) -> str:
    """Max 31 chars, no invalid characters."""
    for c in ['\\', '/', '?', '*', '[', ']', ':']:
        name = name.replace(c, '-')
    return name[:31]


def export_triangle_xlsx(
    db: Session,
    origin: str,
    destination: str,
    start_date: date,
    end_date: date,
    scrape_date_filter: date | None = None,
) -> str:
    """
    Query data dari DB dan export ke XLSX format segitiga.

    Baris = scrape_date, Kolom = travel_date, Value = harga termurah.
    1 sheet per airline.

    Returns:
        str: absolute path ke file XLSX yang dihasilkan.
    """
    _ensure_exports_dir()
    route = f"{origin}-{destination}"

    # Query data
    query = db.query(FlightFare).filter(
        FlightFare.route == route,
        FlightFare.travel_date >= start_date,
        FlightFare.travel_date <= end_date,
        FlightFare.status_scrape == "SUCCESS",
    )
    if scrape_date_filter:
        query = query.filter(FlightFare.scrape_date == scrape_date_filter)

    records = query.order_by(FlightFare.scrape_date, FlightFare.travel_date).all()

    if not records:
        return ""

    # Group by airline -> scrape_date -> travel_date -> cheapest price
    data: dict[str, dict[date, dict[date, float]]] = {}
    for r in records:
        airline = r.airline
        if airline not in data:
            data[airline] = {}
        sd = r.scrape_date
        if sd not in data[airline]:
            data[airline][sd] = {}
        td = r.travel_date
        fare = float(r.basic_fare)
        if td not in data[airline][sd] or fare < data[airline][sd][td]:
            data[airline][sd][td] = fare

    # Collect all travel_dates
    all_travel_dates = sorted({r.travel_date for r in records})

    # Build XLSX
    wb = Workbook()
    if "Sheet" in wb.sheetnames:
        del wb["Sheet"]

    # Styles
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, size=10, color="FFFFFF")
    date_fill = PatternFill(start_color="D9E2F3", end_color="D9E2F3", fill_type="solid")
    border = Border(
        left=Side(style="thin"), right=Side(style="thin"),
        top=Side(style="thin"), bottom=Side(style="thin"),
    )

    for airline in sorted(data.keys()):
        sheet_name = _sanitize_sheet_name(f"{route} {airline}")
        ws = wb.create_sheet(sheet_name)

        # Header row
        cell = ws.cell(row=1, column=1, value="Scrape Date \\ Flight Date")
        cell.font = header_font
        cell.fill = header_fill
        cell.border = border
        cell.alignment = Alignment(horizontal="center", vertical="center")
        ws.column_dimensions["A"].width = 18

        for col_idx, td in enumerate(all_travel_dates, start=2):
            cell = ws.cell(row=1, column=col_idx, value=td.strftime("%Y-%m-%d"))
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
            cell.alignment = Alignment(horizontal="center")
            ws.column_dimensions[get_column_letter(col_idx)].width = 14

        # Data rows (per scrape_date)
        for row_idx, sd in enumerate(sorted(data[airline].keys()), start=2):
            cell = ws.cell(row=row_idx, column=1, value=sd.strftime("%Y-%m-%d"))
            cell.font = Font(bold=True, size=10)
            cell.fill = date_fill
            cell.border = border

            for col_idx, td in enumerate(all_travel_dates, start=2):
                cell = ws.cell(row=row_idx, column=col_idx)
                price = data[airline][sd].get(td)
                if price:
                    cell.value = price
                    cell.number_format = '#,##0'
                else:
                    cell.value = "-"
                cell.border = border
                cell.alignment = Alignment(horizontal="right")

    # Save
    filename = f"aero_{route}_{start_date}_{end_date}.xlsx"
    filepath = os.path.join(EXPORTS_DIR, filename)
    wb.save(filepath)

    return filepath
