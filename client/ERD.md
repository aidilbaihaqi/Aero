# 📐 Entity Relationship Diagram (ERD)

Dokumen ini menjelaskan struktur database utama untuk **Flight Price Monitoring Platform**.

---

## 1️⃣ scrape_runs

Menyimpan informasi setiap eksekusi scraping (scheduled atau manual).

| Field | Type | Description |
|------|------|-------------|
| id | bigint | Primary key |
| run_type | enum | SCHEDULED / MANUAL |
| started_at | timestamp | Waktu mulai run |
| finished_at | timestamp | Waktu selesai run |
| status | enum | SUCCESS / PARTIAL / FAILED |
| triggered_by | string | system / user |
| created_at | timestamp | |

---

## 2️⃣ scrape_logs

Log per rute & maskapai pada satu run.

| Field | Type | Description |
|------|------|-------------|
| id | bigint | Primary key |
| run_id | bigint | FK → scrape_runs.id |
| route | string | BTH-CGK |
| airline | string | Lion Air |
| source_type | enum | AIRLINE / BOOKCABIN |
| scrape_source_page | text | URL sumber |
| status_scrape | enum | SUCCESS / FAILED |
| error_reason | text | Nullable |
| created_at | timestamp | |

---

## 3️⃣ flight_prices

Tabel utama harga tiket (time-series).

| Field | Type | Description |
|------|------|-------------|
| id | bigint | Primary key |
| run_id | bigint | FK → scrape_runs.id |
| scrape_log_id | bigint | FK → scrape_logs.id |
| route | string | BTH-CGK |
| airline | string | Lion Air |
| flight_number | string | JT971 |
| travel_date | date | Tanggal terbang |
| depart_time | time | |
| arrive_time | time | |
| basic_fare | bigint | Harga dasar |
| currency | string | IDR |
| raw_price_label | string | Label harga asli |
| scrape_date | date | Tanggal pengambilan |
| **days_to_departure** | **integer (generated)** | **travel_date - scrape_date (booking window)** |
| scraped_at | timestamp | |
| is_lowest_fare | boolean | True jika termurah |
| created_at | timestamp | |

**Note**: `days_to_departure` adalah generated column yang otomatis menghitung selisih hari antara `travel_date` dan `scrape_date`. Kolom ini sangat berguna untuk analisis booking window dan menentukan waktu optimal pembelian tiket.

---

## 4️⃣ routes (optional master table)

| Field | Type | Description |
|------|------|-------------|
| id | bigint | Primary key |
| origin | string | BTH |
| destination | string | CGK |
| created_at | timestamp | |

---

## 5️⃣ airlines (optional master table)

| Field | Type | Description |
|------|------|-------------|
| id | bigint | Primary key |
| code | string | JT |
| name | string | Lion Air |
| source_type | enum | AIRLINE / BOOKCABIN |
| created_at | timestamp | |

---

## 🔗 Relationships

```
scrape_runs 1 ────< scrape_logs 1 ────< flight_prices
```

- 1 run → banyak log
- 1 log → banyak harga

---

## 📌 Notes Desain

- `flight_prices` bersifat **append-only**
- Analitik berbasis `scrape_date` + `travel_date`
- Data manual & scheduled dibedakan via `run_type`
- Master table (routes, airlines) opsional

### 🛫 Routes Configuration

Total 10 kombinasi route-airline yang dimonitor:

**Batam → Jakarta (4 airlines):**
1. Garuda Indonesia
2. Citilink
3. Lion Air
4. Super Air Jet

**Batam → Medan (1 airline):**
5. Lion Air

**Batam → Surabaya (1 airline):**
6. Lion Air

**Batam → Padang (1 airline):**
7. Lion Air

**Tanjung Pinang → Jakarta (3 airlines):**
8. Citilink
9. Batik Air
10. Garuda Indonesia

**Note:** Tidak ada rute return (one-way only) untuk menyederhanakan scraping.

---

## 🧠 Future Extension

- Materialized view untuk agregasi harian
- Table `price_alerts`
- Table `forecast_results`

