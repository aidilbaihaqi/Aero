# ✈️ Aero — Flight Fare Tracker

**Monitoring Harga Tiket Pesawat Domestik Indonesia**

Aplikasi pelacak harga tiket pesawat modern yang secara otomatis mengumpulkan data (scraping) dari berbagai maskapai untuk rute domestik populer di Indonesia. Dilengkapi dengan dashboard interaktif untuk analisis tren harga dan perbandingan antar maskapai.

![Aero Dashboard](https://via.placeholder.com/800x400?text=Aero+Dashboard+Preview)

---

## ✨ Fitur Utama

- **Multi-Source Scraping**: Mendukung Garuda Indonesia, Citilink, Lion Air, Super Air Jet, dan Batik Air.
- **Flight Analysis**: Grafik tren harga historis, volatilitas harga, dan perbandingan maskapai.
- **Data Export**: Unduh data harga dalam format Excel (XLSX Segitiga), CSV, dan JSON.
- **Responsive Dashboard**: Antarmuka modern yang responsif (Desktop & Mobile) dengan Dark Mode support.
- **Automated Scheduling**: Mendukung penjadwalan scraping otomatis (cron job).

---

## 🛠️ Teknologi

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Scraping**: Requests, ThreadPoolExecutor (Paralel)
- **Export**: OpenPyXL (XLSX Generation)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI (shadcn/ui flavor)
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 📐 Arsitektur Sistem

```mermaid
graph TD
    User[User] -->|Browser| FE[Frontend (Next.js)]
    FE -->|HTTP JSON| API[Backend API (FastAPI)]
    
    subgraph "Backend Services"
        API -->|Read/Write| DB[(PostgreSQL)]
        API -->|Trigger| Scraper[Scraper Service]
        Scraper -->|Fetch| GIA[Garuda API]
        Scraper -->|Fetch| QG[Citilink API]
        Scraper -->|Fetch| BC[BookCabin API]
    end
    
    subgraph "Reports"
        API -->|Generate| XLSX[Excel Report]
    end
```

---

## 📂 Struktur Proyek

```bash
aero/
├── backend/              # FastAPI Application
│   ├── app/
│   │   ├── models/       # Database Models
│   │   ├── routers/      # API Endpoints
│   │   ├── scrapers/     # Scraper Modules (Garuda, Citilink, BookCabin)
│   │   └── services/     # Business Logic
│   ├── exports/          # Generated Excel files
│   └── requirements.txt  # Python dependencies
│
├── client/               # Next.js Application
│   ├── app/              # App Router Pages
│   ├── components/       # React Components
│   └── lib/              # Utilities
```

---

## 🚀 Panduan Instalasi

### Prasyarat
- Python 3.11+
- Node.js 18+ / Bun
- PostgreSQL Database

### 1. Setup Backend

```bash
cd backend

# Buat virtual environment
python -m venv .venv

# Activate venv (Windows)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Setup Environment (.env)
cp .env.example .env
# Edit .env dan sesuaikan DATABASE_URL

# Jalankan Server
make dev
# Server berjalan di http://localhost:8000
```

### 2. Setup Frontend

```bash
cd client

# Install dependencies
bun install  # atau npm install

# Jalankan Development Server
bun dev      # atau npm run dev

# Buka browser
# http://localhost:3000
```

---

## 📡 Dokumentasi API

Dokumentasi interaktif (Swagger UI) tersedia di:  
`http://localhost:8000/docs`

**Endpoint Utama:**

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/flights/search` | Scrape penerbangan untuk 1 tanggal |
| `POST` | `/api/flights/bulk` | Scrape 1 rute untuk range tanggal |
| `POST` | `/api/flights/bulk-routes` | Scrape beberapa rute sekaligus |
| `GET` | `/api/flights/history` | Melihat riwayat harga tersimpan |
| `GET` | `/api/flights/summary` | Analisis tren harga harian |
| `POST` | `/api/flights/export` | Download laporan Excel |

---

## ⚠️ Status Proyek

> **Current State (Feb 2026)**:
> 
> - **Backend**: ✅ Selesai 100%. API, Database, dan Scraper berfungsi penuh.
> - **Frontend**: ✅ Selesai 100% (UI). 
> - **Integrasi**: 🚧 **Sedang Berjalan**. Saat ini Frontend masih menggunakan **Mock Data** dan belum terhubung ke Backend API.
> 
> Untuk melihat data real, gunakan langsung **API (Swagger UI)** atau cek database. Integrasi penuh FE-BE akan dikerjakan pada update berikutnya.

---

## 📝 Konfigurasi Rute

Aplikasi ini secara default memantau rute berikut:

| Rute | Maskapai |
|------|----------|
| **BTH (Batam) → CGK (Jakarta)** | Garuda, Citilink, Lion Air, Super Air Jet |
| **BTH (Batam) → KNO (Medan)** | Lion Air |
| **BTH (Batam) → SUB (Surabaya)** | Lion Air |
| **BTH (Batam) → PDG (Padang)** | Lion Air |
| **TNJ (Tanjung Pinang) → CGK** | Garuda, Citilink, Batik Air |

---

Developed with ❤️ by **Aero Team**.
