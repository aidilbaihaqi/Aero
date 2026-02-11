import json
from tabulate import tabulate
from garuda_scraper import scrape_garuda
from citilink_scraper import scrape_citilink
from bookcabin_scraper import scrape_bookcabin

# =============================================
# Konfigurasi
# =============================================
ORIGIN = "BTH"
DESTINATION = "CGK"
DEPART_DATE = "2026-02-15"

# Token Citilink (ambil dari browser DevTools)
CITILINK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJVbmtub3duIiwianRpIjoiODQ3YTk1YmQtNzZiOC1jZTdiLWY2ZDItYjFiOGI5YmI2OWExIiwiaXNzIjoiZG90UkVaIEFQSSJ9.4kV8E38GtdUobNKW_tPgMBPV4z2bb4Suf3o_da_oKKI"

# =============================================
# Scrape Garuda
# =============================================
print(f"\n{'=' * 70}")
print(f"  ✈ Garuda Indonesia: {ORIGIN} -> {DESTINATION} ({DEPART_DATE})")
print(f"{'=' * 70}\n")

try:
    garuda_flights = scrape_garuda(ORIGIN, DESTINATION, DEPART_DATE)
    if garuda_flights:
        table = []
        for f in garuda_flights:
            table.append([
                f["route"],
                f["airline"],
                f["flight_number"],
                f["depart_time"],
                f["arrival_time"],
                f["fare_family"],
                f"Rp {f['base_fare']:,.0f}",
                f"Rp {f['total_fare']:,.0f}",
            ])
        headers = ["Route", "Airline", "Flight", "Depart", "Arrive", "Fare Family", "Base Fare", "Total Fare"]
        print(tabulate(table, headers=headers, tablefmt="grid"))
        print(f"\n  Total: {len(garuda_flights)} penerbangan Garuda ditemukan.")
    else:
        print("  Tidak ada penerbangan Garuda ditemukan.")
except Exception as e:
    print(f"  Error scraping Garuda: {e}")

# =============================================
# Scrape Citilink
# =============================================
print(f"\n{'=' * 70}")
print(f"  ✈ Citilink: {ORIGIN} -> {DESTINATION} ({DEPART_DATE})")
print(f"{'=' * 70}\n")

try:
    citilink_flights = scrape_citilink(ORIGIN, DESTINATION, DEPART_DATE, CITILINK_TOKEN)
    if citilink_flights:
        table = []
        for f in citilink_flights:
            table.append([
                f["route"],
                f["airline"],
                f["flight_number"],
                f["depart_time"],
                f["arrival_time"],
                f"Rp {f['fare_total']:,.0f}",
            ])
        headers = ["Route", "Airline", "Flight", "Depart", "Arrive", "Fare Total"]
        print(tabulate(table, headers=headers, tablefmt="grid"))
        print(f"\n  Total: {len(citilink_flights)} penerbangan Citilink ditemukan.")
    else:
        print("  Tidak ada penerbangan Citilink ditemukan.")
except Exception as e:
    print(f"  Error scraping Citilink: {e}")

# =============================================
# Scrape BookCabin (Super Air Jet, Batik Air, Lion Air)
# =============================================
print(f"\n{'=' * 70}")
print(f"  ✈ BookCabin (Super Air Jet / Batik Air / Lion Air): {ORIGIN} -> {DESTINATION} ({DEPART_DATE})")
print(f"{'=' * 70}\n")

try:
    bookcabin_flights = scrape_bookcabin(ORIGIN, DESTINATION, DEPART_DATE)
    if bookcabin_flights:
        table = []
        for f in bookcabin_flights:
            table.append([
                f["route"],
                f["airline"],
                f["flight_number"],
                f["depart_time"],
                f["arrival_time"],
                f"Rp {f['total_fare']:,.0f}",
            ])
        headers = ["Route", "Airline", "Flight", "Depart", "Arrive", "Total Fare"]
        print(tabulate(table, headers=headers, tablefmt="grid"))
        print(f"\n  Total: {len(bookcabin_flights)} penerbangan BookCabin ditemukan.")
    else:
        print("  Tidak ada penerbangan ditemukan.")
except Exception as e:
    print(f"  Error scraping BookCabin: {e}")

# =============================================
# Simpan semua hasil ke JSON
# =============================================
all_results = {
    "garuda": garuda_flights if 'garuda_flights' in dir() else [],
    "citilink": citilink_flights if 'citilink_flights' in dir() else [],
    "bookcabin": bookcabin_flights if 'bookcabin_flights' in dir() else [],
}
with open("result_all.json", "w") as f:
    json.dump(all_results, f, indent=2, ensure_ascii=False)
print(f"\n📁 Semua hasil disimpan ke result_all.json")
