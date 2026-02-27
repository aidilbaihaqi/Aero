"""
citilink_auth.py — Automasi Guest Login/Token Retrieval menggunakan Playwright.
"""
import logging
from playwright.sync_api import sync_playwright

logger = logging.getLogger("aero.scraper.auth")

def get_citilink_token() -> str | None:
    """
    Kunjungi situs Citilink secara headless, intersepsi request ke API dotrez,
    dan ekstrak Authorization Bearer token secara otomatis.
    """
    token = None
    logger.info("Memulai Playwright untuk mengambil token Citilink baru...")

    with sync_playwright() as p:
        # Gunakan Firefox atau Chromium, Chromium biasa lebih cepat tapi Firefox lebih jarang di-block
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        def handle_request(route, request):
            nonlocal token
            # Tangkap request ke dotrezapi (API inti Navitaire Citilink)
            if "dotrezapi" in request.url and "Authorization" in request.headers:
                auth_header = request.headers["Authorization"]
                if auth_header.startswith("Bearer "):
                    token = auth_header.replace("Bearer ", "")
            # Lanjutkan traffic normal
            route.continue_()

        # Intercept semua traffic
        page.route("**/*", handle_request)

        try:
            # 1. Kunjungi halaman utama Citilink
            page.goto("https://www.citilink.co.id/", timeout=45000)
            
            # Tunggu beberapa saat agar script authenticator background berjalan
            page.wait_for_timeout(5000)
            
            # 2. Jika token masih 0, pancing request dengan mengunjungi booking engine
            if not token:
                logger.info("Mengunjungi system reservasi langsung...")
                page.goto("https://book2.citilink.co.id/", timeout=45000)
                page.wait_for_timeout(8000)

        except Exception as e:
            logger.error("Error menjalankan automatisasi Citilink token: %s", e)
        finally:
            browser.close()

    if token:
        logger.info("Token Citilink baru berhasil didapatkan (%s...)", token[:20])
    else:
        logger.warning("Gagal mendapatkan token Citilink.")
        
    return token
