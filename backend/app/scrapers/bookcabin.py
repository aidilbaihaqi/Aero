import requests

URL_BOOKCABIN = "https://api-ibe.bookcabin.com/flight/v2/search"

# Maskapai yang ingin diambil
TARGET_AIRLINES = {
    "IU": "Super Air Jet",
    "ID": "Batik Air",
    "JT": "Lion Air",
}


def fetch_bookcabin(origin, destination, depart_date):
    """
    Fetch data penerbangan dari API BookCabin.
    
    Args:
        origin: kode bandara asal, misal "BTH"
        destination: kode bandara tujuan, misal "CGK"
        depart_date: tanggal berangkat, format "YYYY-MM-DD"
    
    Returns:
        dict: response JSON dari API BookCabin
    """
    params = {
        "origin": origin,
        "destination": destination,
        "departureDate": depart_date,
        "countAdult": 1,
        "countChild": 0,
        "countInfant": 0,
        "cabinClass": "ECONOMY",
        "tripType": "ONE_WAY",
        "promoCode": "",
        "currencyCode": "IDR",
    }

    response = requests.get(URL_BOOKCABIN, params=params, timeout=15)
    response.raise_for_status()
    return response.json()


def parse_bookcabin(data):
    """
    Parse response JSON BookCabin menjadi list penerbangan yang rapi.
    
    Hanya mengambil maskapai Super Air Jet (IU), Batik Air (ID), Lion Air (JT).
    
    Struktur response:
      data.fares.depart[] -> setiap item punya:
        - carrier / carrierName (kode & nama maskapai)
        - breakdowns[0] (paxType="ADULT") -> baseFare, totalFare
        - flightGroups[0].flights[0] -> flightNumber, departure/arrival, airline info
    
    Args:
        data: dict response JSON dari API BookCabin
        
    Returns:
        list[dict]: daftar penerbangan dengan field:
            - route, airline, flight_number, travel_date, depart_time,
              arrival_time, base_fare, total_fare
    """
    fares = data.get("data", {}).get("fares", {}).get("depart", [])

    flights = []

    for fare in fares:
        carrier_code = fare.get("carrier", "")

        # Filter hanya maskapai yang kita mau
        if carrier_code not in TARGET_AIRLINES:
            continue

        carrier_name = fare.get("carrierName", TARGET_AIRLINES.get(carrier_code, ""))

        # --- Harga dari breakdowns (ambil paxType ADULT) ---
        base_fare = 0
        total_fare = 0
        for breakdown in fare.get("breakdowns", []):
            if breakdown.get("paxType") == "ADULT":
                base_fare = breakdown.get("baseFare", 0)
                total_fare = breakdown.get("totalFare", 0)
                break

        # --- Info penerbangan dari flightGroups ---
        flight_groups = fare.get("flightGroups", [])
        if not flight_groups:
            continue

        group = flight_groups[0]

        # Filter hanya penerbangan DIRECT (tanpa transit/stop)
        if group.get("numberOfStops", 0) > 0:
            continue
        if len(group.get("flights", [])) > 1:
            continue

        origin = group.get("origin", "")
        destination = group.get("destination", "")

        group_flights = group.get("flights", [])
        if not group_flights:
            continue

        flight = group_flights[0]
        flight_number = f"{carrier_code}{flight.get('flightNumber', '')}"

        departure_raw = flight.get("departureDateTime", "")
        arrival_raw = flight.get("arrivalDateTime", "")

        # Parse datetime: "2026-02-15T19:50:00" -> date & time
        travel_date = departure_raw[:10] if departure_raw else "-"
        depart_time = departure_raw[11:16] if departure_raw else "-"
        arrival_time = arrival_raw[11:16] if arrival_raw else "-"

        flights.append({
            "route": f"{origin}-{destination}",
            "airline": carrier_name,
            "flight_number": flight_number,
            "travel_date": travel_date,
            "depart_time": depart_time,
            "arrival_time": arrival_time,
            "base_fare": base_fare,
            "total_fare": total_fare,
        })

    return flights


def scrape_bookcabin(origin, destination, depart_date):
    """
    Fungsi utama: fetch + parse sekaligus.
    
    Args:
        origin: kode bandara asal
        destination: kode bandara tujuan
        depart_date: tanggal berangkat (YYYY-MM-DD)
    
    Returns:
        list[dict]: daftar penerbangan dari BookCabin (Super Air Jet, Batik Air, Lion Air)
    """
    data = fetch_bookcabin(origin, destination, depart_date)
    return parse_bookcabin(data)
