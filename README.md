# ✈️ Aero — Flight Fare Tracker

Aplikasi pelacak harga tiket pesawat dengan scraping otomatis dari beberapa maskapai.

## Struktur Proyek

```
aero/
├── backend/              ← FastAPI + PostgreSQL
│   ├── app/              ← Source code
│   ├── .env              ← Backend env vars
│   ├── .venv/            ← Python virtual environment
│   ├── Makefile
│   └── requirements.txt
├── client/               ← Next.js Frontend
│   ├── app/              ← Pages
│   ├── components/       ← React components
│   └── package.json
├── .gitignore
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1    # Windows PowerShell
pip install -r requirements.txt
make dev
```
API docs: http://localhost:8000/docs

### Frontend
```bash
cd client
bun install
bun dev
```

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/flights/search` | Scrape 1 tanggal |
| `POST` | `/api/flights/bulk` | Scrape 1 rute, range tanggal |
| `POST` | `/api/flights/bulk-routes` | Scrape beberapa rute sekaligus |
| `POST` | `/api/flights/export` | Export ke XLSX |
| `GET` | `/api/flights/history` | Query riwayat harga |
| `GET` | `/api/flights/runs` | List scrape runs |
| `GET` | `/api/flights/runs/{run_id}` | Detail scrape run |
| `GET` | `/api/flights/summary` | Min/avg/max/DoD/volatility |

## Rute Default

| Rute | Maskapai |
|------|----------|
| BTH → CGK | Garuda, Citilink, Lion Air, Super Air Jet, Batik Air |
| BTH → KNO | Lion Air |
| BTH → SUB | Lion Air |
| BTH → PDG | Lion Air |
| TNJ → CGK | Garuda, Citilink, Batik Air |
