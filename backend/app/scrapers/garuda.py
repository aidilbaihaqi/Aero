import logging
import requests
import re

logger = logging.getLogger("aero.scraper")

URL_GARUDA = "https://web-api.garuda-indonesia.com/ga/revamp/v1.0/dapi/airFare"

# Fare family yang ingin diambil (Economy saja)
TARGET_FARES = ["ECO COMFORT", "ECO AFFORDABLE", "ECO PROMO"]


def fetch_garuda(origin, destination, depart_date):
    """
    Fetch data penerbangan dari API Garuda Indonesia.
    
    Args:
        origin: kode bandara asal, misal "BTH"
        destination: kode bandara tujuan, misal "CGK"
        depart_date: tanggal berangkat, format "YYYY-MM-DD"
    
    Returns:
        dict: response JSON dari API Garuda
    """
    payload = {
        "parameter": {
            "data": {
                "origin": origin,
                "destination": destination,
                "class": "ECONOMY",
                "depart": depart_date,
                "pax": "1ADT",
                "promoCode": "",
                "isWeb": True,
                "showSoldOut": True,
                "upSell": True
            }
        }
    }

    response = requests.post(URL_GARUDA, json=payload, timeout=15)

    # Garuda API sering return 500 untuk tanggal tertentu (no flights / server issue)
    if response.status_code == 500:
        logger.info("Garuda API returned 500 for %s-%s on %s — no data available", origin, destination, depart_date)
        return {}

    response.raise_for_status()
    return response.json()


def parse_segment_key(segment_key):
    """
    Parse key pricingData seperti 'SEG-GA157-BTHCGK-2026-02-15-1740'
    
    Returns:
        dict dengan flight_number, route, origin, destination, travel_date, depart_time
        atau None jika format tidak cocok
    """
    # Format: SEG-{airline}{flight_no}-{origin}{dest}-{date}-{HHMM}
    pattern = r"^SEG-([A-Z]{2})(\d+)-([A-Z]{3})([A-Z]{3})-(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})$"
    match = re.match(pattern, segment_key)
    if not match:
        return None

    airline_code, flight_no, origin, dest, date, hour, minute = match.groups()

    return {
        "airline_code": airline_code,
        "flight_number": f"{airline_code}{flight_no}",
        "origin": origin,
        "destination": dest,
        "route": f"{origin}-{dest}",
        "travel_date": date,
        "depart_time": f"{hour}:{minute}",
    }


def parse_garuda(data):
    """
    Parse response JSON Garuda menjadi list penerbangan yang rapi.
    
    Menggabungkan info dari flightData (airline name, arrival time)
    dan pricingData (base_fare per fare family).
    
    Hanya mengambil fare family ECO (COMFORT, AFFORDABLE, PROMO).
    
    Args:
        data: dict response JSON dari API Garuda
        
    Returns:
        list[dict]: daftar penerbangan dengan field:
            - route, airline, flight_number, depart_time, arrival_time,
              fare_family, base_fare, total_fare
    """
    if not data or not isinstance(data, dict):
        return []

    result_data = data.get("result") or {}
    flight_data_list = result_data.get("flightData") or []
    pricing_data = result_data.get("pricingData") or {}

    # Buat lookup dari flightData: sid -> detail penerbangan
    flight_lookup = {}
    for flight in flight_data_list:
        sid = flight.get("sid", "")
        detail = flight.get("detail", [{}])[0]
        flight_lookup[sid] = {
            "airline": detail.get("airlineName", ""),
            "arrival_time": detail.get("arrival", {}).get("dateTime", ""),
            "depart_time_full": detail.get("departure", {}).get("dateTime", ""),
        }

    # Parse pricingData
    flights = []
    for segment_key, fare_families in pricing_data.items():
        # Parse info dari key segment
        seg_info = parse_segment_key(segment_key)
        if not seg_info:
            continue

        # Ambil info tambahan dari flightData
        flight_detail = flight_lookup.get(segment_key, {})
        airline_name = flight_detail.get("airline", seg_info["airline_code"])

        # Format arrival_time dari ISO datetime
        arrival_raw = flight_detail.get("arrival_time", "")
        if arrival_raw:
            # "2026-02-15T19:30:00.000+07:00" -> "19:30"
            arrival_time = arrival_raw[11:16]
        else:
            arrival_time = "-"

        # Filter hanya fare family ECO yang kita mau
        for fare in fare_families:
            fare_desc = fare.get("fareFamilyDescription", "")
            if fare_desc not in TARGET_FARES:
                continue

            # Ambil harga dari totalPrices[0]
            total_prices = fare.get("totalPrices", [{}])[0]
            base_fare = total_prices.get("base", 0)
            total_fare = total_prices.get("total", 0)

            flights.append({
                "route": seg_info["route"],
                "airline": airline_name,
                "flight_number": seg_info["flight_number"],
                "travel_date": seg_info["travel_date"],
                "depart_time": seg_info["depart_time"],
                "arrival_time": arrival_time,
                "fare_family": fare_desc,
                "base_fare": base_fare,
                "total_fare": total_fare,
            })

    return flights


def scrape_garuda(origin, destination, depart_date):
    """
    Fungsi utama: fetch + parse sekaligus.
    
    Args:
        origin: kode bandara asal
        destination: kode bandara tujuan
        depart_date: tanggal berangkat (YYYY-MM-DD)
    
    Returns:
        list[dict]: daftar penerbangan ekonomi
    """
    data = fetch_garuda(origin, destination, depart_date)
    return parse_garuda(data)
