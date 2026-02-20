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

## 🚀 Panduan Instalasi (Docker)

Jika Anda memiliki Docker Desktop, cara termudah adalah menggunakan Docker Compose:

```bash
docker-compose up --build
```
Aplikasi akan tersedia di:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 🛠️ Panduan Instalasi Manual (Tanpa Docker)

Gunakan panduan ini jika Anda ingin menjalankan aplikasi langsung di sistem lokal Anda.

### 1. Prasyarat
- **Python 3.11+**
- **Node.js 20+** atau **Bun**
- **PostgreSQL 15+**

### 2. Persiapan Database
1. Buka PostgreSQL (pgAdmin atau psql).
2. Buat database baru bernama `aero`:
   ```sql
   CREATE DATABASE aero;
   ```

### 3. Setup Backend
```bash
cd backend

# 1. Buat virtual environment
python -m venv .venv

# 2. Aktifkan venv (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Konfigurasi Environment
cp .env.example .env
# Edit .env dan sesuaikan DATABASE_URL:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/aero
```

### 4. Setup Frontend
```bash
cd client

# 1. Install dependencies
bun install  # atau npm install

# 2. Jalankan server development
bun dev      # atau npm run dev
```

### 5. Menjalankan Aplikasi
1. **Backend**: Di terminal venv, jalankan `make dev` atau `uvicorn app.main:app --reload`.
2. **Frontend**: Di terminal client, pastikan server development berjalan.
3. Buka `http://localhost:3000`.

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

## 🔄 Reset & Data Seeding

Jika Anda ingin menghapus semua data dan memulai dari awal (Fresh Install), ikuti langkah berikut:

### Menggunakan Docker
1. Hentikan container dan hapus volume database:
   ```bash
   docker-compose down -v
   ```
2. Jalankan ulang aplikasi:
   ```bash
   docker-compose up --build
   ```
3. Seed data awal (User Admin):
   ```bash
   docker-compose exec backend python -m app.seed
   ```

### Menggunakan Manual (Local)
1. Hapus database lama dan buat baru (via PostgreSQL CLI / pgAdmin):
   ```sql
   DROP DATABASE aero;
   CREATE DATABASE aero;
   ```
2. Jalankan script seeding (di terminal backend dengan venv aktif):
   ```bash
   python -m app.seed
   ```
   *Script ini akan otomatis membuat tabel ulang dan menambahkan user admin default.*

---

Developed with ❤️ by **Aero Team**.
