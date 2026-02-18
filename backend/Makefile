.PHONY: venv install run dev clean

# Activate venv: .\.venv\Scripts\Activate.ps1

# Buat virtual environment
venv:
	python -m venv .venv

# Install dependencies (activate venv dulu!)
install:
	pip install -r requirements.txt

# Run server (production)
run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run server (development dengan auto-reload)
dev:
	uvicorn app.main:app --reload --port 8000

# Setup lengkap (venv + install)
setup: venv
	.venv\Scripts\pip install -r requirements.txt
	@echo Setup selesai! Jalankan: make dev

# Bersihkan cache
clean:
	if exist __pycache__ rmdir /s /q __pycache__
	if exist app\__pycache__ rmdir /s /q app\__pycache__
	if exist exports rmdir /s /q exports
