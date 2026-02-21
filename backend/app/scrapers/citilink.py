import requests

URL_CITILINK = "https://dotrezapi-akm.prod.citilink.co.id/qg/dotrez/api/nsk/v1/availability/search/ssr"


def fetch_citilink(origin, destination, depart_date, token):
    """
    Fetch data penerbangan dari API Citilink (Navitaire dotREZ).
    
    Args:
        origin: kode bandara asal, misal "BTH"
        destination: kode bandara tujuan, misal "CGK"
        depart_date: tanggal berangkat, format "YYYY-MM-DD"
        token: JWT token dari browser session Citilink
    
    Returns:
        dict: response JSON dari API Citilink
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://book2.citilink.co.id",
        "Referer": "https://book2.citilink.co.id/",
    }

    payload = {
        "criteria": [{
            "dates": {"beginDate": depart_date},
            "filters": {
                "bundleControlFilter": 2,
                "compressionType": 1,
                "exclusionType": 0,
                "maxConnections": 10,
                "productClasses": ["NR"]
            },
            "stations": {
                "originStationCodes": [origin],
                "destinationStationCodes": [destination],
                "searchOriginMacs": False,
                "searchDestinationMacs": False
            }
        }],
        "passengers": {"types": [{"count": 1, "type": "ADT"}]},
        "ssrs": [],
        "codes": {"promotionCode": "SPRGREEN", "currencyCode": "IDR"},
        "taxesAndFees": 2
    }

    response = requests.post(URL_CITILINK, json=payload, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()


def parse_citilink(data):
    """
    Parse response JSON Citilink menjadi list penerbangan yang rapi.
    
    Menggabungkan info dari journeysAvailableByMarket (jadwal penerbangan)
    dan faresAvailable (harga per penerbangan) via fareAvailabilityKey.
    
    Args:
        data: dict response JSON dari API Citilink
        
    Returns:
        list[dict]: daftar penerbangan dengan field:
            - route, airline, flight_number, travel_date, depart_time,
              arrival_time, fare_total
    """
    results = data.get("data", {}).get("results", [])
    fares_available = data.get("data", {}).get("faresAvailable", {})

    flights = []

    for result in results:
        trips = result.get("trips", [])
        for trip in trips:
            markets = trip.get("journeysAvailableByMarket", {})
            for market_key, journeys in markets.items():
                for journey in journeys:
                    # --- Info penerbangan dari designator ---
                    designator = journey.get("designator", {})
                    origin = designator.get("origin", "")
                    destination = designator.get("destination", "")
                    departure_raw = designator.get("departure", "")
                    arrival_raw = designator.get("arrival", "")

                    # Parse datetime: "2026-02-15T19:00:00" -> date & time
                    travel_date = departure_raw[:10] if departure_raw else "-"
                    depart_time = departure_raw[11:16] if departure_raw else "-"
                    arrival_time = arrival_raw[11:16] if arrival_raw else "-"

                    # --- Info flight number dari segments ---
                    segments = journey.get("segments", [])
                    if segments:
                        identifier = segments[0].get("identifier", {})
                        carrier_code = identifier.get("carrierCode", "QG")
                        flight_no = identifier.get("identifier", "")
                        flight_number = f"{carrier_code}{flight_no}"
                    else:
                        carrier_code = "QG"
                        flight_number = "-"

                    # --- Harga dari faresAvailable via fareAvailabilityKey ---
                    fare_key = None
                    journey_fares = journey.get("fares", [])
                    if journey_fares:
                        fare_key = journey_fares[0].get("fareAvailabilityKey", "")

                    fare_total = 0
                    if fare_key and fare_key in fares_available:
                        totals = fares_available[fare_key].get("totals", {})
                        fare_total = totals.get("fareTotal", 0)

                    flights.append({
                        "route": f"{origin}-{destination}",
                        "airline": "CITILINK",
                        "flight_number": flight_number,
                        "travel_date": travel_date,
                        "depart_time": depart_time,
                        "arrival_time": arrival_time,
                        "fare_total": int(fare_total),
                    })

    return flights


def scrape_citilink(origin, destination, depart_date, token):
    """
    Fungsi utama: fetch + parse sekaligus.
    
    Args:
        origin: kode bandara asal
        destination: kode bandara tujuan
        depart_date: tanggal berangkat (YYYY-MM-DD)
        token: JWT token dari browser session Citilink
    
    Returns:
        list[dict]: daftar penerbangan Citilink
    """
    data = fetch_citilink(origin, destination, depart_date, token)
    return parse_citilink(data)
