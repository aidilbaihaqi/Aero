# 📋 Implementation Status - Aero Price

> **Last Updated**: 2026-02-01 20:45 WIB  
> **Status**: Frontend 100% Complete | Backend (Scraping) 0%

---

## 🎯 Project Overview

Aero Price adalah platform monitoring harga tiket pesawat untuk rute domestik Indonesia. Sistem ini melakukan scraping otomatis dari berbagai maskapai dan menyajikan data dalam dashboard yang interaktif.

---

## ✅ FRONTEND - Sudah Diimplementasi

### Halaman

| Halaman | Route | File | Status | Catatan |
|---------|-------|------|--------|---------|
| Dashboard | `/dashboard` | `pages/dashboard.tsx` | ✅ Complete | Cards, charts, summary |
| Routes | `/routes` | `pages/routes.tsx` | ✅ Complete | Tabel 10 rute penerbangan |
| Analytics | `/analytics` | `pages/analytics.tsx` | ✅ Complete | 3 metric cards, 2 charts |
| History | `/history` | `pages/history.tsx` | ✅ Complete | Scrape history log |
| Settings | `/app-settings` | `pages/settings.tsx` | ✅ Complete | App settings |
| Export | `/export` | `pages/export.tsx` | ✅ Complete | Excel/CSV/JSON export |

### Fitur yang Sudah Berfungsi

| Fitur | Status | Detail |
|-------|--------|--------|
| Toast Notification | ✅ | Mengganti browser alert dengan toast modern |
| Export Excel | ✅ | Multi-sheet per rute/maskapai dengan format yang benar |
| Export CSV | ✅ | Format flat data |
| Export JSON | ✅ | Data terstruktur |
| Filter Export | ✅ | Filter berdasarkan rute dan maskapai |
| Dynamic Stats | ✅ | Hitung estimasi records dan sheet count |
| Responsive Layout | ✅ | Desktop sidebar + Mobile bottom nav |
| Dark Cards | ✅ | CardSolid dengan desain premium |
| Charts | ✅ | Price trend & airline comparison (recharts) |

### UI Components

#### Base Components (`components/ui/`)
| Component | File | Status |
|-----------|------|--------|
| Button | `button.tsx` | ✅ |
| Card | `card.tsx` | ✅ |
| CardSolid | `card-solid.tsx` | ✅ |
| CardGlass | `card-glass.tsx` | ✅ |
| Input | `input.tsx` | ✅ |
| Label | `label.tsx` | ✅ |
| Switch | `switch.tsx` | ✅ |
| Badge | `badge.tsx` | ✅ |
| Table | `table.tsx` | ✅ |
| Dialog | `dialog.tsx` | ✅ |
| Popover | `popover.tsx` | ✅ |
| MultiSelect | `multi-select.tsx` | ✅ |
| StatusBadge | `status-badge.tsx` | ✅ |
| DateRangePicker | `date-range-picker.tsx` | ✅ |
| LoadingSpinner | `loading-spinner.tsx` | ✅ |
| Toast | `toast.tsx` | ✅ NEW |

#### Scraping Components (`components/scraping/`)
| Component | File | Status |
|-----------|------|--------|
| FilterPanel | `filter-panel.tsx` | ✅ |
| RunDetailsModal | `run-details-modal.tsx` | ✅ |
| ManualTriggerModal | `manual-trigger-modal.tsx` | ✅ |

#### Utilities (`lib/`)
| Utility | File | Status |
|---------|------|--------|
| Export Excel/CSV/JSON | `export-excel.ts` | ✅ NEW |

---

## ⏳ FRONTEND - Menggunakan Mock Data

Semua halaman frontend saat ini menggunakan **dummy data** yang di-hardcode. Data perlu diganti dengan data real dari API setelah backend selesai:

| Data | Lokasi | Perlu Koneksi API |
|------|--------|-------------------|
| Price trend chart | `dashboard.tsx` | Ya |
| Route performance | `dashboard.tsx` | Ya |
| Routes table | `routes.tsx` | Ya |
| Analytics metrics | `analytics.tsx` | Ya |
| History log | `history.tsx` | Ya |
| Export data | `export-excel.ts` | Ya (harga real) |

---

## 🔴 BACKEND - Belum Diimplementasi

### Database
- [ ] Migration: `scrape_runs` - Log setiap scraping run
- [ ] Migration: `scrape_logs` - Detail log per request
- [ ] Migration: `flight_prices` - Data harga tiket
- [ ] Eloquent models

### API Endpoints
- [ ] `GET /api/dashboard/stats` - Dashboard summary
- [ ] `GET /api/routes` - Daftar rute dengan harga terakhir
- [ ] `GET /api/analytics` - Data untuk analytics
- [ ] `GET /api/history` - Scrape run history
- [ ] `POST /api/scrape/trigger` - Manual trigger scraping
- [ ] `GET /api/export` - Export data dengan filter

### Scraping System
- [ ] Scraper untuk Garuda Indonesia
- [ ] Scraper untuk Citilink
- [ ] Scraper untuk Lion Air
- [ ] Scraper untuk Super Air Jet
- [ ] Scraper untuk Batik Air
- [ ] Queue system untuk scraping jobs
- [ ] Scheduled scraping (Laravel Scheduler sudah siap)

---

## ⚙️ Konfigurasi yang Sudah Siap

### Laravel Scheduler
- **File**: `bootstrap/app.php`
- **Command**: `scrape:scheduled` (placeholder)
- **Schedule**: Daily at 07:30 Asia/Jakarta

### Flight Routes Configuration (`config/scraping.php`)

| Sheet Name | Maskapai | Rute | No. Penerbangan | Jam |
|------------|----------|------|-----------------|-----|
| GIA-BTMJKT | Garuda Indonesia | BTH → CGK | GA-168 | 08:00 |
| GIA-TNJKT | Garuda Indonesia | TNJ → CGK | GA-287 | 15:00 |
| CITILINK-BTMJKT | Citilink | BTH → CGK | QG-712 | 09:30 |
| CITILINK-TNJKT | Citilink | TNJ → CGK | QG-821 | 12:00 |
| LION-BTMJKT | Lion Air | BTH → CGK | JT-374 | 10:00 |
| LION-BTMKNO | Lion Air | BTH → KNO | JT-971 | 09:50 |
| LION-BTMSBY | Lion Air | BTH → SUB | JT-948 | 14:00 |
| LION-BTMPDG | Lion Air | BTH → PDG | JT-265 | 11:30 |
| AIRJET-BTMJKT | Super Air Jet | BTH → CGK | IU-854 | 07:00 |
| BATIK-TNJKT | Batik Air | TNJ → CGK | ID-6863 | 10:00 |

---

## 📊 Format Export Excel

Setiap sheet memiliki struktur:

```
┌─────────────────────────────────────────────────────────────────┐
│ Maskapai        : Lion Air                                      │
│ Tujuan          : Batam-Medan                                   │
│ Jam Keberangkatan: 09.50 - 11.15                                │
│ No. Penerbangan : JT971                                         │
├─────────────────┬───────────┬───────────┬───────────┬──────────┤
│ Tanggal         │ 01/12/2025│ 02/12/2025│ 03/12/2025│ ...      │
│ Pengamatan      │           │           │           │          │
├─────────────────┼───────────┼───────────┼───────────┼──────────┤
│ 20-Nov-25       │           │           │           │          │
│ 21-Nov-25       │           │           │           │          │
│ 24-Nov-25       │ 934.500   │ 1.147.600 │ 1.094.300 │ ...      │
│ 25-Nov-25       │ 987.800   │ 1.041.000 │ 1.041.000 │ ...      │
└─────────────────┴───────────┴───────────┴───────────┴──────────┘
```

- **Baris**: Tanggal Pengamatan (scrape date)
- **Kolom**: Tanggal Terbang (travel date)
- **Cell**: Harga tiket (format: 1.234.567)

---

## 📦 Dependencies

### Frontend
```json
{
  "recharts": "^2.x",
  "xlsx": "^0.18.5",
  "@radix-ui/react-switch": "^1.x",
  "@radix-ui/react-popover": "^1.x",
  "@radix-ui/react-dialog": "^1.x",
  "lucide-react": "^0.x"
}
```

### Fonts
- **Display**: Manrope (Google Fonts)
- **Body**: Sora (Google Fonts)

---

## 🚀 Running the Project

```bash
# Start Laravel server
php artisan serve

# Start Vite dev server (dengan bun)
bun run dev

# Access at
http://127.0.0.1:8000
```

---

## 📌 Next Steps (Scraping Team)

1. **Target websites** - Tentukan website yang akan di-scrape
2. **Teknologi** - Python (Selenium/Playwright) atau Node.js (Puppeteer)
3. **Database schema** - Design tabel untuk menyimpan hasil scraping
4. **API endpoints** - Buat endpoint untuk connect ke frontend
5. **Scheduler** - Implementasi actual scraping command

---

## 📝 Rute/Maskapai yang Dimonitor

| # | Rute | Maskapai |
|---|------|----------|
| 1 | BTH - CGK | Garuda Indonesia |
| 2 | BTH - CGK | Citilink |
| 3 | BTH - CGK | Lion Air |
| 4 | BTH - CGK | Super Air Jet |
| 5 | BTH - KNO | Lion Air |
| 6 | BTH - SUB | Lion Air |
| 7 | BTH - PDG | Lion Air |
| 8 | TNJ - CGK | Citilink |
| 9 | TNJ - CGK | Batik Air |
| 10 | TNJ - CGK | Garuda Indonesia |
