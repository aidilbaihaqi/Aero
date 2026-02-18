# Flight Price Monitoring Platform - Implementation Tasks

## Phase 1: Foundation & Core Scraping (MVP)

### 1. Database Schema & Models

#### 1.1 Create scrape_runs migration
- [x] Create migration for `scrape_runs` table with fields: id, run_type, status, started_at, finished_at, total_routes, successful_routes, failed_routes, total_prices_collected, error_summary, timestamps
- [x] Add indexes for run_type, started_at, status
- [x] References: Requirements Section 1.1 (Database migrations & models)

#### 1.2 Create scrape_logs migration
- [x] Create migration for `scrape_logs` table with fields: id, scrape_run_id (FK), route, airline, source, status, prices_collected, error_message, attempt_number, started_at, finished_at, created_at
- [x] Add indexes for scrape_run_id, route, airline, status
- [x] Add foreign key constraint to scrape_runs with cascade delete
- [ ] References: Requirements Section 1.1 (Database migrations & models)

#### 1.3 Create flight_prices migration
- [x] Create migration for `flight_prices` table with fields: id, scrape_run_id (FK), scrape_log_id (FK), route, airline, flight_number, travel_date, depart_time, arrive_time, price, currency, raw_price_label, is_lowest_fare, scrape_date, source, created_at
- [x] Add generated column `days_to_departure` (travel_date - scrape_date) for booking window analysis
- [x] Add indexes for route, airline, travel_date, scrape_date, scrape_run_id, is_lowest_fare, days_to_departure
- [x] Add composite indexes for (route, travel_date) and (route, airline, travel_date)
- [x] Add foreign key constraints with cascade delete
- [x] Update FlightPrice model to include days_to_departure in casts
- [x] References: Requirements Section 1.1 (Database migrations & models), Design Section 3.1 (Schema Overview)

#### 1.4 Create Eloquent Models
- [x] Create ScrapeRun model with relationships (hasMany scrape_logs, hasMany flight_prices)
- [x] Create ScrapeLog model with relationships (belongsTo scrape_run, hasMany flight_prices)
- [x] Create FlightPrice model with relationships (belongsTo scrape_run, belongsTo scrape_log)
- [x] Add fillable fields and casts for all models
- [x] References: Requirements Section 1.2 (Create Eloquent Models)

#### 1.5 Create configuration file for scraping
- [x] Create config/scraping.php with routes configuration (BTH-CGK, BTH-KNO, BTH-SUB, BTH-PDG, TNJ-CGK with specific airlines)
- [x] Map each route to available airlines (10 total combinations, no return routes)
- [x] Add airlines configuration (Garuda, Citilink, Lion Air, Super Air Jet, Batik Air) with source types
- [x] Add schedule configuration (time: 07:30, timezone: Asia/Jakarta, end_date: 2026-03-31)
- [x] Add retry configuration (max_attempts: 3, backoff_seconds, retry_window_minutes: 30)
- [x] Add HTTP configuration (timeout, user_agents, delay_between_requests)
- [x] Add validation configuration (min_price, max_price)
- [x] References: Requirements Section 2.2 (Scraper Configuration System), Design Section 4.1 (Scraper Configuration)

### 2. Scraper Framework

#### 2.1 Create Abstract Scraper Base Class
- [x] Create app/Services/Scrapers/AbstractScraper.php with abstract methods: scrape(), buildUrl(), parseResponse()
- [x] Implement makeRequest() method with HTTP client, retry logic, user-agent rotation
- [x] Implement rate limiting with configurable delays between requests
- [x] Add error handling framework with logging
- [x] References: Requirements Section 2.1 (Abstract Scraper Service), Design Section 4.1 (Abstract Scraper Interface)

#### 2.2 Create Price Parser Service
- [x] Create app/Services/PriceParser.php to extract prices from various formats
- [x] Handle currency symbols, dots, commas (e.g., "Rp 1.234.567", "1,234,567")
- [x] Convert to float/decimal for storage
- [x] Add validation for price ranges
- [x] References: Requirements Section 2.3 (Price Parser & Validator), Design Section 4.4 (Price Parser & Validator)

#### 2.3 Create Price Validator Service
- [x] Create app/Services/PriceValidator.php for data validation
- [x] Validate required fields (route, airline, flight_number, travel_date, price)
- [x] Validate price within reasonable range (min/max from config)
- [x] Validate dates (travel_date >= scrape_date)
- [x] Validate times format
- [x] References: Requirements Section 2.3 (Price Parser & Validator), Design Section 4.4 (Price Parser & Validator)

#### 2.4 Create Price Deduplicator Service
- [x] Create app/Services/PriceDeduplicator.php for deduplication logic
- [x] Implement flight identity calculation (route + airline + flight_number + travel_date + depart_time)
- [x] Group prices by flight identity within single scrape run
- [x] Keep only lowest price per identity
- [x] Mark lowest fare with is_lowest_fare = true
- [x] References: Requirements Section 7.1 (Deduplication Logic), Design Section 4.4 (Price Deduplicator)

### 3. Airline-Specific Scrapers (Phase 1 - MVP)

#### 3.1 Implement Garuda Indonesia Scraper
- [ ] Create app/Services/Scrapers/GarudaScraper.php extending AbstractScraper
- [ ] Implement buildUrl() for Garuda official website
- [ ] Implement parseResponse() to extract flight data from Garuda's HTML/API
- [ ] Extract flight_number, depart_time, arrive_time, basic_fare
- [ ] Handle Garuda-specific price formats
- [ ] Add error handling for structure changes
- [ ] References: Requirements Section 3.1 (Garuda Indonesia Scraper)

#### 3.2 Implement Citilink Scraper
- [ ] Create app/Services/Scrapers/CitilinkScraper.php extending AbstractScraper
- [ ] Implement buildUrl() for Citilink official website
- [ ] Implement parseResponse() to extract flight data from Citilink's HTML/API
- [ ] Extract flight_number, depart_time, arrive_time, basic_fare
- [ ] Handle Citilink-specific price formats
- [ ] Add error handling for structure changes
- [ ] References: Requirements Section 3.2 (Citilink Scraper)

### 4. Job Queue System

#### 4.1 Create Scrape Job
- [ ] Create app/Jobs/ScrapeFlightPricesJob.php implementing ShouldQueue
- [ ] Set tries = 3 and backoff = [30, 60, 120] seconds
- [ ] Accept parameters: scrapeRunId, route, airlineConfig, dateRange
- [ ] Create scrape_log record before execution
- [ ] Call appropriate scraper based on airline configuration
- [ ] Validate and deduplicate prices before storage
- [ ] Store prices in flight_prices table with scrape_log_id
- [ ] Update scrape_log with status (SUCCESS/FAILED), prices_collected, error_message
- [ ] Handle exceptions and re-throw for retry mechanism
- [ ] References: Requirements Section 4.1 (Scrape Job Implementation), Design Section 4.3 (Queue Job Design)

#### 4.2 Create Scrape Orchestrator Service
- [ ] Create app/Services/ScrapeOrchestrator.php
- [ ] Implement executeRun() method accepting run_type (scheduled/manual)
- [ ] Create scrape_run record with status RUNNING
- [ ] Calculate date range (today → 2026-03-31)
- [ ] Dispatch ScrapeFlightPricesJob for each route × airline combination
- [ ] Implement updateRunStatus() to aggregate results from scrape_logs
- [ ] Update scrape_run with final status (SUCCESS/PARTIAL/FAILED)
- [ ] Calculate total_routes, successful_routes, failed_routes, total_prices_collected
- [ ] References: Requirements Section 4.2 (Run Orchestrator), Design Section 4.2 (Scraping Orchestration)

#### 4.3 Create Scheduled Command
- [ ] Create app/Console/Commands/ScrapeScheduledCommand.php
- [ ] Set signature as 'scrape:scheduled'
- [ ] Check if current date is after 2026-03-31, exit if true
- [ ] Inject ScrapeOrchestrator and call executeRun('scheduled')
- [ ] Log run start with run ID
- [ ] References: Requirements Section 4.3 (Scheduled Command), Design Section 4.5 (Scheduling)

#### 4.4 Configure Laravel Scheduler
- [ ] Update app/Console/Kernel.php schedule() method
- [ ] Schedule 'scrape:scheduled' command daily at 07:30 Asia/Jakarta timezone
- [ ] Add onOneServer() to prevent duplicate runs
- [ ] Add withoutOverlapping() to prevent concurrent runs
- [ ] Add runInBackground() for non-blocking execution
- [ ] References: Requirements Section 4.3 (Scheduled Command), Design Section 4.5 (Laravel Scheduler Configuration)

### 5. Error Handling & Logging

#### 5.1 Create Scrape Log Repository
- [ ] Create app/Repositories/ScrapeLogRepository.php
- [ ] Implement createLog() method for creating scrape_log records
- [ ] Implement updateLogStatus() for updating status and error messages
- [ ] Implement getLogsByRunId() for retrieving logs by scrape_run_id
- [ ] References: Requirements Section 6.1 (Scrape Log Repository)

#### 5.2 Configure Logging Channels
- [ ] Update config/logging.php with dedicated scraping channel
- [ ] Configure daily log rotation
- [ ] Set appropriate log levels (ERROR, WARNING, INFO, DEBUG)
- [ ] Add context to log messages (run_id, route, airline)
- [ ] References: Requirements Section 6.3 (Monitoring & Alerts), Design Section 7.4 (Logging Strategy)

## Phase 2: Complete Scraping Coverage & API

### 6. Additional Airline Scrapers

#### 6.1 Implement Bookcabin Scraper (Lion Air, Super Air Jet, Batik Air)
- [ ] Create app/Services/Scrapers/BookcabinScraper.php extending AbstractScraper
- [ ] Implement buildUrl() for Bookcabin.com with airline parameter
- [ ] Implement parseResponse() to extract flight data for multiple airlines
- [ ] Handle airline-specific selectors within Bookcabin
- [ ] Extract flight_number, depart_time, arrive_time, basic_fare for Lion Air
- [ ] Extract flight_number, depart_time, arrive_time, basic_fare for Super Air Jet
- [ ] Extract flight_number, depart_time, arrive_time, basic_fare for Batik Air
- [ ] Add error handling for structure changes
- [ ] References: Requirements Section 3.3 (Bookcabin Scraper)

### 7. API Endpoints

#### 7.1 Create API Routes File
- [ ] Create routes/api.php if not exists
- [ ] Configure API middleware in bootstrap/app.php
- [ ] Set up API prefix and rate limiting
- [ ] References: Requirements Section 5.1 (Scrape Runs API), Design Section 5.1 (API Endpoints)

#### 7.2 Create Scrape Runs API Controller
- [ ] Create app/Http/Controllers/Api/ScrapeRunController.php
- [ ] Implement index() method: GET /api/scrape-runs with pagination, filters (run_type, status)
- [ ] Implement show() method: GET /api/scrape-runs/{id} with related logs
- [ ] Implement manual() method: POST /api/scrape-runs/manual to trigger manual scraping
- [ ] Add validation for manual trigger (optional routes, airlines filters)
- [ ] Return standardized JSON responses with success/error format
- [ ] References: Requirements Section 5.1 (Scrape Runs API), Design Section 5.1 (API Endpoints)

#### 7.3 Create Flight Prices API Controller
- [ ] Create app/Http/Controllers/Api/FlightPriceController.php
- [ ] Implement index() method: GET /api/flight-prices with filters (route, airline, travel_date_from, travel_date_to, scrape_date_from, scrape_date_to, is_lowest_fare)
- [ ] Add pagination support (default 50, max 200 per page)
- [ ] Add sorting options (sort_by, sort_order)
- [ ] Implement summary() method: GET /api/flight-prices/summary for aggregated statistics (min, max, avg, count)
- [ ] Return standardized JSON responses
- [ ] References: Requirements Section 5.2 (Flight Prices API), Design Section 5.1 (API Endpoints)

#### 7.4 Create API Resource Classes
- [ ] Create app/Http/Resources/ScrapeRunResource.php for transforming ScrapeRun model
- [ ] Create app/Http/Resources/ScrapeLogResource.php for transforming ScrapeLog model
- [ ] Create app/Http/Resources/FlightPriceResource.php for transforming FlightPrice model
- [ ] Format dates, prices, and relationships consistently
- [ ] References: Design Section 5.2 (Response Format Standards)

### 8. Manual Scraping Feature

#### 8.1 Implement Manual Trigger Logic
- [ ] Update ScrapeOrchestrator to accept optional route/airline filters
- [ ] Filter routes and airlines based on manual trigger parameters
- [ ] Create scrape_run with run_type = 'manual'
- [ ] Dispatch jobs only for selected routes/airlines
- [ ] References: Requirements Section 5.1 (Scrape Runs API)

#### 8.2 Add Manual Trigger Validation
- [ ] Create app/Http/Requests/ManualScrapeRequest.php
- [ ] Validate routes array (must be valid route codes from config)
- [ ] Validate airlines array (must be valid airline codes from config)
- [ ] Allow empty arrays to scrape all routes/airlines
- [ ] References: Requirements Section 5.1 (Scrape Runs API)

## Phase 3: Frontend Dashboard & Visualization

### 9. Frontend Project Setup

#### 9.1 Configure API Client
- [ ] Create resources/js/services/api.ts with axios configuration
- [ ] Set base URL from environment variable
- [ ] Add request/response interceptors for error handling
- [ ] Create typed API methods for scrape runs, flight prices
- [ ] References: Requirements Section 1.1 (React + Vite Configuration)

#### 9.2 Create TypeScript Types
- [ ] Create resources/js/types/scraping.ts with interfaces for ScrapeRun, ScrapeLog, FlightPrice
- [ ] Add enums for RunType, RunStatus, ScrapeStatus
- [ ] Create types for API responses (paginated, single, error)
- [ ] Create types for filter parameters
- [ ] References: Requirements Section 1.1 (React + Vite Configuration)

#### 9.3 Create Shared UI Components
- [ ] Create resources/js/components/ui/data-table.tsx for sortable, filterable tables
- [ ] Create resources/js/components/ui/date-range-picker.tsx for date filtering
- [ ] Create resources/js/components/ui/multi-select.tsx for route/airline selection
- [ ] Create resources/js/components/ui/status-badge.tsx for run/scrape status display
- [ ] Create resources/js/components/ui/loading-spinner.tsx for loading states
- [ ] Create resources/js/components/ui/toast.tsx for notifications
- [ ] References: Requirements Section 1.3 (UI Component Library)

### 10. Dashboard Pages

#### 10.1 Create Scrape Runs Page
- [ ] Create resources/js/pages/scrape-runs/index.tsx
- [ ] Display runs list table with columns: run_type, status, started_at, finished_at, total_routes, successful_routes, failed_routes
- [ ] Add status badges with color coding (SUCCESS=green, PARTIAL=yellow, FAILED=red)
- [ ] Add pagination controls
- [ ] Add filter by run_type and status
- [ ] Add "Manual Scrape" button to trigger modal
- [ ] References: Requirements Section 2.1 (Scrape Runs Page)

#### 10.2 Create Run Details Modal
- [ ] Create resources/js/components/scraping/run-details-modal.tsx
- [ ] Display run summary (status, times, counts)
- [ ] Display scrape_logs table with per-route/airline status
- [ ] Show error messages for failed logs
- [ ] Add close button
- [ ] References: Requirements Section 2.1 (Scrape Runs Page)

#### 10.3 Create Manual Scrape Trigger Modal
- [ ] Create resources/js/components/scraping/manual-trigger-modal.tsx
- [ ] Add route multi-select dropdown (optional, default all)
- [ ] Add airline multi-select dropdown (optional, default all)
- [ ] Add confirmation message
- [ ] Add submit button with loading state
- [ ] Call POST /api/scrape-runs/manual on submit
- [ ] Show success/error toast notification
- [ ] Close modal on success
- [ ] References: Requirements Section 3.1 (Manual Trigger UI)

#### 10.4 Create Flight Prices Page
- [ ] Create resources/js/pages/flight-prices/index.tsx
- [ ] Display price data table with columns: scrape_date, travel_date, route, airline, flight_number, depart_time, price, is_lowest_fare
- [ ] Add pagination controls
- [ ] Format price as IDR currency (Rp 1.234.567)
- [ ] Add badge for is_lowest_fare = true
- [ ] Add sorting by columns (travel_date, price, scrape_date)
- [ ] References: Requirements Section 2.2 (Flight Prices Page)

#### 10.5 Create Filter Panel Component
- [ ] Create resources/js/components/scraping/filter-panel.tsx
- [ ] Add route multi-select dropdown
- [ ] Add airline multi-select dropdown
- [ ] Add travel date range picker
- [ ] Add scrape date range picker
- [ ] Add "Lowest Fare Only" checkbox
- [ ] Add "Apply Filters" and "Reset Filters" buttons
- [ ] Sync filters with URL query parameters
- [ ] References: Requirements Section 5.1 (Filter Components), Section 5.2 (Filter State Management)

### 11. Real-time Status Updates

#### 11.1 Create Polling Hook
- [ ] Create resources/js/hooks/use-polling.ts
- [ ] Accept API endpoint and interval (default 5 seconds)
- [ ] Start polling when component mounts
- [ ] Stop polling when run status is completed (SUCCESS/PARTIAL/FAILED)
- [ ] Return current data and loading state
- [ ] References: Requirements Section 3.2 (Real-time Status Updates)

#### 11.2 Implement Status Monitoring in Run Details
- [ ] Update run-details-modal.tsx to use polling hook
- [ ] Poll GET /api/scrape-runs/{id} every 5 seconds while status = RUNNING
- [ ] Update UI with current status and progress
- [ ] Show per-route status indicators
- [ ] Stop polling when run completes
- [ ] References: Requirements Section 3.2 (Real-time Status Updates)

## Phase 4: Export & Analytics

### 12. Export Feature

#### 12.1 Create Export Service
- [ ] Install maatwebsite/excel package via composer
- [ ] Create app/Services/ExportService.php
- [ ] Implement generateSpreadsheet() method accepting filters (route, airline, date_from, date_to, format)
- [ ] Query flight_prices with filters
- [ ] Group data by route
- [ ] Create one sheet per route with columns: Scrape Date, Travel Date, Airline, Flight Number, Departure Time, Arrival Time, Price (IDR), Is Lowest Fare, Source
- [ ] Use streaming for memory efficiency with large datasets
- [ ] Support both Excel (.xlsx) and CSV formats
- [ ] References: Requirements Section 5.4 (Export API), Design Section 8 (Export Feature Design)

#### 12.2 Create Export API Controller
- [ ] Create app/Http/Controllers/Api/ExportController.php
- [ ] Implement spreadsheet() method: GET /api/export/spreadsheet
- [ ] Accept query params: route, airline, date_from, date_to, format (xlsx|csv)
- [ ] Validate parameters
- [ ] Call ExportService to generate file
- [ ] Return StreamedResponse with appropriate headers
- [ ] Set filename with timestamp
- [ ] References: Requirements Section 5.4 (Export API), Design Section 8.2 (Export Implementation)

#### 12.3 Create Export UI Page
- [ ] Create resources/js/pages/export/index.tsx
- [ ] Add route multi-select dropdown
- [ ] Add airline multi-select dropdown
- [ ] Add date range picker (travel_date)
- [ ] Add format selection (Excel/CSV radio buttons)
- [ ] Add "Export" button with loading state
- [ ] Call GET /api/export/spreadsheet with selected filters
- [ ] Trigger file download in browser
- [ ] Show success/error toast notification
- [ ] References: Requirements Section 4.1 (Export Configuration UI), Section 4.2 (Export Download Handler)

### 13. Analytics Feature

#### 13.1 Create Analytics API Controller
- [ ] Create app/Http/Controllers/Api/AnalyticsController.php
- [ ] Implement priceTrends() method: GET /api/analytics/price-trends
- [ ] Accept query params: route, airline, date_range
- [ ] Return time-series data grouped by scrape_date with min/avg/max prices
- [ ] Implement cheapestDays() method: GET /api/analytics/cheapest-days
- [ ] Analyze historical data to find best booking days (e.g., days before travel with lowest prices)
- [ ] Implement priceComparison() method: GET /api/analytics/price-comparison
- [ ] Compare prices across airlines for same route and date range
- [ ] Implement volatility() method: GET /api/analytics/volatility
- [ ] Calculate price volatility metrics (standard deviation, price range)
- [ ] References: Requirements Section 5.3 (Analytics API), Design Section 5.1 (Analytics API)

#### 13.2 Create Analytics Dashboard Page
- [ ] Create resources/js/pages/analytics/index.tsx
- [ ] Add filter panel (route, airline, date range)
- [ ] Display key metrics cards (min price, max price, avg price, volatility)
- [ ] Add price trend line chart using Recharts
- [ ] Add airline comparison bar chart
- [ ] Add cheapest days indicator/table
- [ ] Add price spike highlights
- [ ] References: Requirements Section 2.3 (Analytics Dashboard), Section 6.1 (Price Trend Charts), Section 6.2 (Statistical Summaries)

#### 13.3 Install and Configure Recharts
- [ ] Install recharts package via npm
- [ ] Create resources/js/components/charts/price-trend-chart.tsx
- [ ] Implement line chart with time-series data (scrape_date vs price)
- [ ] Support multi-airline comparison on same chart
- [ ] Add interactive tooltips
- [ ] Add date range selection
- [ ] Create resources/js/components/charts/airline-comparison-chart.tsx
- [ ] Implement bar chart comparing airlines for same route
- [ ] References: Requirements Section 6.1 (Price Trend Charts), Design Section 6.4 (Charting Library)

## Phase 5: Production Hardening & Deployment

### 14. Docker Configuration

#### 14.1 Create Dockerfile for Laravel
- [ ] Create Dockerfile with PHP 8.2, required extensions
- [ ] Install Composer dependencies
- [ ] Copy application code
- [ ] Set proper permissions for storage and cache
- [ ] Configure PHP-FPM
- [ ] References: Requirements Section 9.1 (Docker Compose Setup), Design Section 9.1 (Docker Compose Setup)

#### 14.2 Create Docker Compose Configuration
- [ ] Create docker-compose.yml with services: app, db, nginx, scheduler, queue
- [ ] Configure PostgreSQL service with persistent volume
- [ ] Configure Nginx service with reverse proxy to Laravel
- [ ] Configure scheduler service running php artisan schedule:work
- [ ] Configure queue worker service running php artisan queue:work --tries=3
- [ ] Set up service dependencies and health checks
- [ ] References: Requirements Section 9.1 (Docker Compose Setup), Design Section 9.1 (Docker Compose Setup)

#### 14.3 Create Nginx Configuration
- [ ] Create nginx.conf for serving Laravel application
- [ ] Configure PHP-FPM upstream
- [ ] Set up location blocks for API and frontend
- [ ] Configure static file serving
- [ ] Add gzip compression
- [ ] References: Requirements Section 9.1 (Docker Compose Setup)

#### 14.4 Create Environment Configuration
- [ ] Update .env.example with all required variables
- [ ] Add database configuration (PostgreSQL)
- [ ] Add queue configuration (database driver)
- [ ] Add scraping configuration variables
- [ ] Add timezone configuration (Asia/Jakarta)
- [ ] Document all environment variables
- [ ] References: Requirements Section 9.2 (Environment Configuration), Design Section 9.2 (Environment Configuration)

### 15. Monitoring & Health Checks

#### 15.1 Create Health Check Endpoint
- [ ] Create app/Http/Controllers/Api/HealthController.php
- [ ] Implement check() method: GET /api/health
- [ ] Check database connection status
- [ ] Check queue worker status
- [ ] Get last scrape run timestamp
- [ ] Get disk space available
- [ ] Return JSON with status: healthy/unhealthy
- [ ] References: Requirements Section 6.3 (Monitoring & Alerts), Design Section 12.1 (Health Checks)

#### 15.2 Configure Monitoring Metrics
- [ ] Create app/Services/MetricsService.php
- [ ] Implement getDailyScrapeSuccessRate() method
- [ ] Implement getAveragePricesCollected() method
- [ ] Implement getFailedRoutesCount() method
- [ ] Implement getRetryFrequency() method
- [ ] Store metrics in cache for dashboard display
- [ ] References: Design Section 12.2 (Metrics to Monitor)

### 16. Database Backup & Maintenance

#### 16.1 Create Backup Script
- [ ] Create scripts/backup-database.sh for PostgreSQL dump
- [ ] Add compression (gzip)
- [ ] Add timestamp to filename
- [ ] Configure retention policy (7 daily, 4 weekly)
- [ ] Add option to upload to cloud storage (optional)
- [ ] References: Requirements Section 14.2 (Data Backup Strategy), Design Section 14.2 (Data Backup Strategy)

#### 16.2 Create Backup Command
- [ ] Create app/Console/Commands/BackupDatabaseCommand.php
- [ ] Set signature as 'backup:database'
- [ ] Execute backup script
- [ ] Log backup success/failure
- [ ] Schedule daily execution in Kernel.php
- [ ] References: Requirements Section 14.2 (Data Backup Strategy)

### 17. Testing

#### 17.1 Create Unit Tests for Scrapers
- [ ] Create tests/Unit/Services/Scrapers/AbstractScraperTest.php
- [ ] Test makeRequest() with mocked HTTP responses
- [ ] Test rate limiting logic
- [ ] Test error handling
- [ ] Create tests/Unit/Services/PriceParserTest.php
- [ ] Test various price formats parsing
- [ ] Create tests/Unit/Services/PriceValidatorTest.php
- [ ] Test validation rules
- [ ] Create tests/Unit/Services/PriceDeduplicatorTest.php
- [ ] Test deduplication logic with sample data
- [ ] References: Requirements Section 13.1 (Backend Testing)

#### 17.2 Create Integration Tests for Jobs
- [ ] Create tests/Feature/Jobs/ScrapeFlightPricesJobTest.php
- [ ] Test job execution with mocked scraper
- [ ] Test retry logic on failure
- [ ] Test scrape_log creation and updates
- [ ] Test flight_prices storage
- [ ] References: Requirements Section 13.1 (Backend Testing)

#### 17.3 Create API Tests
- [ ] Create tests/Feature/Api/ScrapeRunControllerTest.php
- [ ] Test GET /api/scrape-runs with pagination and filters
- [ ] Test GET /api/scrape-runs/{id}
- [ ] Test POST /api/scrape-runs/manual
- [ ] Create tests/Feature/Api/FlightPriceControllerTest.php
- [ ] Test GET /api/flight-prices with various filters
- [ ] Test GET /api/flight-prices/summary
- [ ] Create tests/Feature/Api/ExportControllerTest.php
- [ ] Test GET /api/export/spreadsheet
- [ ] References: Requirements Section 13.1 (Backend Testing)

### 18. Documentation

#### 18.1 Create API Documentation
- [ ] Create docs/api.md with all endpoint documentation
- [ ] Document request/response formats
- [ ] Document query parameters and filters
- [ ] Add example requests and responses
- [ ] Document error codes and messages
- [ ] References: Requirements Section 19.1 (Technical Documentation)

#### 18.2 Create Deployment Guide
- [ ] Create docs/deployment.md with VPS setup instructions
- [ ] Document Docker Compose deployment steps
- [ ] Document environment variable configuration
- [ ] Document SSL certificate setup (optional)
- [ ] Document cron setup for Laravel Scheduler
- [ ] Add troubleshooting section
- [ ] References: Requirements Section 19.2 (Operational Documentation)

#### 18.3 Create Maintenance Guide
- [ ] Create docs/maintenance.md
- [ ] Document database backup/restore procedures
- [ ] Document scraper update process when website structure changes
- [ ] Document common issues and solutions
- [ ] Document monitoring dashboard setup
- [ ] Document log file locations and rotation
- [ ] References: Requirements Section 19.2 (Operational Documentation)

#### 18.4 Create User Guide
- [ ] Create docs/user-guide.md
- [ ] Document dashboard navigation
- [ ] Document filter usage
- [ ] Document export functionality
- [ ] Document manual scraping trigger
- [ ] Add screenshots (optional)
- [ ] References: Requirements Section 19.2 (Operational Documentation)

### 19. Final Integration & Testing

#### 19.1 End-to-End Testing
- [ ] Test complete scheduled scraping flow (command → orchestrator → jobs → storage)
- [ ] Test manual scraping flow (UI → API → orchestrator → jobs → storage)
- [ ] Test export generation with various filters
- [ ] Test analytics calculations with sample data
- [ ] Test error handling and retry logic
- [ ] Test partial failure scenarios
- [ ] References: Requirements Section 13.3 (Manual Testing)

#### 19.2 Performance Testing
- [ ] Test API response times with large datasets
- [ ] Test pagination performance
- [ ] Test export generation with 6+ months of data
- [ ] Test concurrent scraping jobs
- [ ] Optimize slow queries with EXPLAIN
- [ ] References: Requirements Section 10 (Performance Considerations)

#### 19.3 VPS Deployment
- [ ] Set up VPS with Ubuntu 22.04 LTS (2 vCPU, 4GB RAM, 50GB SSD)
- [ ] Install Docker and Docker Compose
- [ ] Clone repository to VPS
- [ ] Configure .env file with production values
- [ ] Run docker-compose up -d
- [ ] Run migrations: docker-compose exec app php artisan migrate
- [ ] Set up cron for Laravel Scheduler
- [ ] Configure firewall (allow ports 80, 443, 22)
- [ ] Test scheduled scraping execution
- [ ] Monitor logs for errors
- [ ] References: Requirements Section 9.3 (VPS Requirements), Design Section 9.3 (VPS Requirements)

## Optional Enhancements (Post-MVP)

### 20. Advanced Features (Nice-to-Have)

#### 20.1 Price Alerts
- [ ]* Create price_alerts table migration
- [ ]* Create PriceAlert model
- [ ]* Implement alert checking logic in scraping job
- [ ]* Add email notification service
- [ ]* Create alerts management UI
- [ ]* References: Requirements Section 15.1 (Post-MVP Features - Operational Improvements)

#### 20.2 Price Forecasting
- [ ]* Research time-series forecasting algorithms
- [ ]* Implement basic forecasting service using historical data
- [ ]* Create forecast API endpoint
- [ ]* Add forecast visualization to analytics dashboard
- [ ]* References: Requirements Section 15.1 (Post-MVP Features - Analytics Enhancements)

#### 20.3 Advanced Analytics
- [ ]* Implement anomaly detection for unusual price spikes
- [ ]* Add seasonal trend analysis
- [ ]* Create booking recommendation engine
- [ ]* Add airline pricing strategy insights
- [ ]* References: Requirements Section 15.1 (Post-MVP Features - Analytics Enhancements)

#### 20.4 Mobile Responsive Design
- [ ]* Update all pages for mobile viewport
- [ ]* Optimize tables for mobile display
- [ ]* Add mobile-friendly navigation
- [ ]* Test on various devices
- [ ]* References: Requirements Section 15.1 (Post-MVP Features - UI/UX)

#### 20.5 Dark Mode
- [ ]* Add theme toggle component
- [ ]* Create dark mode CSS variables
- [ ]* Update all components for dark mode support
- [ ]* Persist theme preference in localStorage
- [ ]* References: Requirements Section 15.1 (Post-MVP Features - UI/UX)

---

## Task Execution Notes

### Priority Levels
- **MUST-HAVE**: Core functionality required for MVP
- **NICE-TO-HAVE**: Optional enhancements marked with asterisk (*)

### Dependencies
- Tasks should be executed in order within each phase
- Some tasks can be parallelized (e.g., different scrapers, frontend components)
- Backend API must be completed before frontend integration

### Testing Strategy
- Write unit tests alongside implementation
- Run integration tests after completing each major component
- Perform end-to-end testing before deployment

### Estimated Timeline
- Phase 1: 2-3 weeks
- Phase 2: 2 weeks
- Phase 3: 2-3 weeks
- Phase 4: 1-2 weeks
- Phase 5: 1 week
- **Total**: 8-11 weeks

### Success Criteria
- All MUST-HAVE tasks completed
- System runs scheduled scraping daily at 07:30 WIB
- Manual scraping works from UI
- Export generates correct spreadsheets
- Analytics provide actionable insights
- System deployed and running on VPS
- Documentation complete
