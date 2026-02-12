# ✈ Aero — Flight Price Scraper API

Backend API untuk scraping dan monitoring harga tiket pesawat domestik Indonesia, dibangun dengan **FastAPI** dan **PostgreSQL**.

## Maskapai yang Didukung

| Sumber API | Maskapai | Tipe |
|---|---|---|
| **Garuda API** | Garuda Indonesia, Citilink (codeshare) | airline |
| **Citilink API** | Citilink (QG) | airline |
| **BookCabin API** | Super Air Jet, Batik Air, Lion Air | bookcabin |

## Setup

### 1. Install Dependencies

```bash
python -m venv .venv
source .venv/Scripts/activate  # Windows
pip install -r requirements.txt
```

### 2. Setup PostgreSQL

Buat database:

```sql
CREATE DATABASE aero;
```

### 3. Konfigurasi Environment

Copy `.env.example` ke `.env` dan sesuaikan:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://user:password@localhost:5432/aero
CITILINK_TOKEN=your_jwt_token_here
SCRAPE_DELAY=1.0
```

### 4. Jalankan Server

```bash
uvicorn app.main:app --reload
```

Tabel akan otomatis dibuat saat pertama kali server jalan.

Buka **Swagger UI** di [http://localhost:8000/docs](http://localhost:8000/docs)

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/flights/search` | Scrape 1 tanggal, simpan ke DB |
| `POST` | `/api/flights/bulk` | Scrape range tanggal, simpan ke DB |
| `POST` | `/api/flights/export` | Export dari DB ke XLSX (triangle format) |
| `GET` | `/api/flights/history` | Query riwayat harga (data primer) |
| `GET` | `/api/flights/runs` | List scrape runs (data meta) |
| `GET` | `/api/flights/runs/{run_id}` | Detail 1 scrape run |
| `GET` | `/api/flights/summary` | Data turunan: min/avg/max/DoD/volatility |

### Contoh Request

**Search 1 tanggal:**
```
GET /api/flights/search?origin=BTH&destination=CGK&date=2026-02-15
```

**Bulk scrape:**
```json
POST /api/flights/bulk
{
  "origin": "BTH",
  "destination": "CGK",
  "start_date": "2026-02-15",
  "end_date": "2026-03-31",
  "run_type": "MANUAL"
}
```

**Query history:**
```
GET /api/flights/history?route=BTH-CGK&airline=citilink&limit=50
```

**Query daily summary:**
```
GET /api/flights/summary?route=BTH-CGK&travel_date_from=2026-02-15
```

## Database Schema

### 1. `scrape_runs` — Data Meta

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| run_id | VARCHAR(50) | UUID per scrape run |
| run_type | VARCHAR(10) | SCHEDULED / MANUAL |
| scraped_at | TIMESTAMP | Waktu pengambilan data |
| scrape_date | DATE | Tanggal pengamatan (dimensi time-series) |
| route | VARCHAR(10) | Rute yang di-scrape |
| status | VARCHAR(10) | RUNNING / COMPLETED / FAILED |
| total_records | INTEGER | Jumlah record yang diambil |
| total_errors | INTEGER | Jumlah error |

### 2. `flight_fares` — Data Primer

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| run_id | FK | Link ke scrape_runs |
| route | VARCHAR(10) | Rute, e.g. "BTH-CGK" |
| airline | VARCHAR(50) | Nama maskapai |
| source | VARCHAR(30) | garuda_api / citilink_api / bookcabin_api |
| travel_date | DATE | Tanggal terbang |
| flight_number | VARCHAR(10) | Nomor penerbangan |
| depart_time | VARCHAR(5) | Jam berangkat |
| arrive_time | VARCHAR(5) | Jam tiba |
| basic_fare | DECIMAL | Harga |
| currency | VARCHAR(3) | IDR |
| source_type | VARCHAR(15) | airline / bookcabin |
| is_lowest_fare | BOOLEAN | Harga terendah per airline+tanggal |

### 3. `fare_daily_summary` — Data Turunan

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| route | VARCHAR(10) | Rute |
| airline | VARCHAR(50) | Maskapai |
| travel_date | DATE | Tanggal terbang |
| scrape_date | DATE | Tanggal pengamatan |
| daily_min_price | DECIMAL | Harga min hari itu |
| daily_avg_price | DECIMAL | Harga rata-rata |
| daily_max_price | DECIMAL | Harga max |
| price_change_dod | DECIMAL | Perubahan harga day-over-day |
| volatility | FLOAT | Variasi harga |
| cheapest_airline_per_day | VARCHAR | Maskapai termurah |

## Project Structure

```
aero/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings (from .env)
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models/
│   │   └── flight.py        # ScrapeRun, FlightFare, FareDailySummary
│   ├── scrapers/
│   │   ├── garuda.py
│   │   ├── citilink.py
│   │   └── bookcabin.py
│   ├── schemas/
│   │   └── flight.py        # Pydantic request/response models
│   ├── services/
│   │   ├── scraper_service.py   # Scraping + DB save + summary
│   │   └── export_service.py    # XLSX triangle export
│   └── routers/
│       └── flights.py       # API endpoints
├── .env.example
├── requirements.txt
└── README.md
```

## Catatan

### Citilink JWT Token

Citilink API butuh JWT token dari browser:
1. Buka `https://book2.citilink.co.id/`
2. DevTools (`F12`) → **Network** → cari request ke `availability/search/ssr`
3. Copy `Authorization: Bearer <token>`
4. Update `CITILINK_TOKEN` di `.env`

### XLSX Triangle Format

Export menghasilkan file Excel dengan format segitiga:
- **Baris** = tanggal scrape (kapan data diambil)
- **Kolom** = tanggal terbang
- **Nilai** = harga termurah
- **1 sheet** per maskapai
