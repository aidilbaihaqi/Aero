# ✈ Aero — Flight Price Scraper

Scraper harga tiket pesawat dari berbagai sumber API untuk rute domestik Indonesia.

## Maskapai yang Didukung

| Sumber API | Maskapai | Metode |
|---|---|---|
| **Garuda API** | Garuda Indonesia | POST (public) |
| **Citilink API** | Citilink (QG) | POST + JWT Token |
| **BookCabin API** | Super Air Jet, Batik Air, Lion Air | GET (public) |

## Instalasi

```bash
# Clone repository
git clone https://github.com/aidilbaihaqi/Aero.git
cd Aero

# Buat virtual environment
python -m venv .venv
source .venv/Scripts/activate  # Windows
# source .venv/bin/activate    # Linux/Mac

# Install dependencies
pip install requests tabulate
```

## Penggunaan

### Konfigurasi

Edit variabel di `main.py`:

```python
ORIGIN = "BTH"           # Kode bandara asal
DESTINATION = "CGK"      # Kode bandara tujuan
DEPART_DATE = "2026-02-15"  # Tanggal berangkat (YYYY-MM-DD)
```

### Menjalankan

```bash
python main.py
```

Output berupa tabel penerbangan dari ketiga sumber, beserta file `result_all.json`.

### Contoh Output

```
======================================================================
  ✈ Garuda Indonesia: BTH -> CGK (2026-02-15)
======================================================================

+---------+------------------+--------+--------+--------+----------------+--------------+--------------+
| Route   | Airline          | Flight | Depart | Arrive | Fare Family    | Base Fare    | Total Fare   |
+=========+==================+========+========+========+================+==============+==============+
| BTH-CGK | GARUDA INDONESIA | GA157  | 17:40  | 19:30  | ECO AFFORDABLE | Rp 1,259,000 | Rp 1,691,400 |
+---------+------------------+--------+--------+--------+----------------+--------------+--------------+

======================================================================
  ✈ Citilink: BTH -> CGK (2026-02-15)
======================================================================

+---------+-----------+--------+--------+--------+--------------+
| Route   | Airline   | Flight | Depart | Arrive | Fare Total   |
+=========+===========+========+========+========+==============+
| BTH-CGK | CITILINK  | QG945  | 19:00  | 20:45  | Rp 1,424,264 |
+---------+-----------+--------+--------+--------+--------------+

======================================================================
  ✈ BookCabin (Super Air Jet / Batik Air / Lion Air): BTH -> CGK
======================================================================

+---------+---------------+--------+--------+--------+--------------+
| Route   | Airline       | Flight | Depart | Arrive | Total Fare   |
+=========+===============+========+========+========+==============+
| BTH-CGK | Super Air Jet | IU881  | 19:50  | 21:35  | Rp 1,424,300 |
+---------+---------------+--------+--------+--------+--------------+
```

## Struktur File

```
aero/
├── main.py                 # Script utama — jalankan semua scraper
├── garuda_scraper.py       # Scraper Garuda Indonesia
├── citilink_scraper.py     # Scraper Citilink
├── bookcabin_scraper.py    # Scraper BookCabin (Super Air Jet, Batik Air, Lion Air)
├── .gitignore
└── README.md
```

## Catatan Penting

### Citilink — JWT Token

Citilink API membutuhkan **JWT token** yang diambil dari browser. Token ini bisa expired sewaktu-waktu.

**Cara mendapatkan token baru:**
1. Buka `https://book2.citilink.co.id/` di browser
2. Buka **DevTools** (`F12`) → tab **Network**
3. Lakukan pencarian penerbangan
4. Cari request ke `availability/search/ssr`
5. Copy nilai header `Authorization: Bearer <token>`
6. Update `CITILINK_TOKEN` di `main.py`

### Filter Penerbangan

- Semua scraper hanya mengambil penerbangan **direct** (tanpa transit)
- Garuda: filter fare family `ECO COMFORT`, `ECO AFFORDABLE`, `ECO PROMO`
- BookCabin: filter maskapai `Super Air Jet (IU)`, `Batik Air (ID)`, `Lion Air (JT)`

## Dependencies

- `requests` — HTTP client
- `tabulate` — Table formatting
