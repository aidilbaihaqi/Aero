# Flight Price Monitoring Platform - Design Document

## 1. System Overview

### 1.1 Purpose
Time-series flight price monitoring platform that scrapes airline prices daily, stores historical data, and provides analytics for price trend analysis until March 31, 2026. Single-user system optimized for VPS deployment.

### 1.2 Core Capabilities
- Automated daily scraping of 5 Indonesian airlines across 10 routes
- Historical price data storage with append-only model
- Manual scraping trigger capability
- Price trend visualization and analytics
- Spreadsheet export functionality
- Real-time scraping status monitoring

### 1.3 Technology Stack
**Backend**: Laravel 11+ (PHP 8.2+)
**Frontend**: React 18+ with Vite, TypeScript, Tailwind CSS
**Database**: PostgreSQL 15+
**Queue**: Database-backed (Laravel Queue)
**Infrastructure**: Docker Compose, Nginx
**Scheduling**: Laravel Scheduler + Cron

### 1.4 Design Principles
1. **Data Integrity First**: Append-only model preserves historical accuracy
2. **Graceful Degradation**: Partial failures don't block entire system
3. **Simplicity Over Complexity**: Single-user system avoids over-engineering
4. **Resilient Scraping**: Retry logic and error handling for transient failures
5. **Maintainability**: Clear separation of concerns, one scraper per airline

---

## 2. Architecture Design

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │  Runs    │  │Analytics │  │  Export  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Laravel)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Layer (Controllers)                  │  │
│  │  - Scrape Runs  - Flight Prices  - Analytics         │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Business Logic Layer                        │  │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │  │
│  │  │ Orchestrator   │  │  Scraper Services        │   │  │
│  │  │  - Run Mgmt    │  │  - Garuda    - Citilink  │   │  │
│  │  │  - Job Dispatch│  │  - Lion Air  - SAJ       │   │  │
│  │  │  - Status Track│  │  - Batik Air             │   │  │
│  │  └────────────────┘  └──────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │  │
│  │  │ Parser/Valid.  │  │  Export Service          │   │  │
│  │  │  - Extract     │  │  - Excel/CSV Generation  │   │  │
│  │  │  - Validate    │  │  - Per-route sheets      │   │  │
│  │  │  - Deduplicate │  │                          │   │  │
│  │  └────────────────┘  └──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Queue System (Database)                  │  │
│  │  - ScrapeFlightPricesJob                             │  │
│  │  - Retry Logic (max 3 attempts)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Scheduler (Laravel Scheduler + Cron)          │  │
│  │  - Daily execution at 07:30 WIB                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ scrape_runs  │  │ scrape_logs  │  │flight_prices │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Scheduled Scraping Flow**:
```
Cron (07:30 WIB) → Laravel Scheduler → ScrapeScheduledCommand
                                              ↓
                                    ScrapeOrchestrator
                                    - Create scrape_run
                                    - Calculate date range
                                              ↓
                        Dispatch Jobs (per route × airline)
                                              ↓
                              ScrapeFlightPricesJob (Queue)
                                              ↓
                                    Airline Scraper
                                    - HTTP Request
                                    - Parse Response
                                              ↓
                                  Parser & Validator
                                  - Extract prices
                                  - Validate data
                                  - Deduplicate
                                              ↓
                                    Database Insert
                                    - flight_prices
                                    - scrape_logs
                                              ↓
                                Update scrape_run status
```

**Manual Scraping Flow**:
```
User clicks "Take Data" → Frontend → POST /api/scrape-runs/manual
                                              ↓
                                    ScrapeOrchestrator
                                    (same flow as scheduled)
```


### 2.3 Key Design Decisions

#### Decision 1: Database-Backed Queue (Not Redis)
**Rationale**: 
- Simpler operations and deployment
- Sufficient for daily scraping workload (not high-throughput)
- Reduces infrastructure complexity
- No additional service to manage
- Built-in with Laravel

**Trade-offs**: Slightly slower than Redis, but acceptable for use case

#### Decision 2: Append-Only Data Model
**Rationale**:
- Preserves complete historical integrity
- No updates or deletes on price records
- Enables accurate time-series analysis
- Simplifies data consistency

**Trade-offs**: Database grows continuously, but manageable until March 2026

#### Decision 3: Per-Route Scraping Isolation
**Rationale**:
- One job per route/airline combination
- Partial failures don't block entire scraping run
- Easier to retry individual failures
- Better error tracking and debugging

**Trade-offs**: More jobs to manage, but improves resilience

#### Decision 4: Lowest Fare Deduplication Within Run
**Rationale**:
- Same flight (identity) may appear multiple times in single scrape
- Store only lowest fare to reduce noise
- Flight identity = route + airline + flight_number + travel_date + depart_time
- Deduplication happens within single scrape_run only

**Trade-offs**: May miss fare class variations, but simplifies analysis

#### Decision 5: Separate Run Tracking (Scheduled vs Manual)
**Rationale**:
- Track run_type to distinguish automated vs user-triggered
- Enables separate analysis of scheduled reliability
- Helps identify manual intervention patterns

**Trade-offs**: None significant


---

## 3. Database Design

### 3.1 Schema Overview

#### Table: `scrape_runs`
Tracks each scraping execution (scheduled or manual).

```sql
CREATE TABLE scrape_runs (
    id BIGSERIAL PRIMARY KEY,
    run_type VARCHAR(20) NOT NULL,           -- 'scheduled' | 'manual'
    status VARCHAR(20) NOT NULL,             -- 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED'
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP NULL,
    total_routes INT DEFAULT 0,
    successful_routes INT DEFAULT 0,
    failed_routes INT DEFAULT 0,
    total_prices_collected INT DEFAULT 0,
    error_summary TEXT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scrape_runs_run_type ON scrape_runs(run_type);
CREATE INDEX idx_scrape_runs_started_at ON scrape_runs(started_at);
CREATE INDEX idx_scrape_runs_status ON scrape_runs(status);
```

**Design Notes**:
- `run_type` distinguishes scheduled vs manual runs
- `status` tracks overall run outcome
- Counters provide quick summary without querying logs
- `error_summary` stores high-level failure reasons

#### Table: `scrape_logs`
Per-route/airline scraping attempt logs.

```sql
CREATE TABLE scrape_logs (
    id BIGSERIAL PRIMARY KEY,
    scrape_run_id BIGINT NOT NULL REFERENCES scrape_runs(id) ON DELETE CASCADE,
    route VARCHAR(10) NOT NULL,              -- e.g., 'CGK-DPS'
    airline VARCHAR(50) NOT NULL,            -- e.g., 'Garuda Indonesia'
    source VARCHAR(50) NOT NULL,             -- e.g., 'garuda_official'
    status VARCHAR(20) NOT NULL,             -- 'SUCCESS' | 'FAILED'
    prices_collected INT DEFAULT 0,
    error_message TEXT NULL,
    attempt_number INT DEFAULT 1,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scrape_logs_run_id ON scrape_logs(scrape_run_id);
CREATE INDEX idx_scrape_logs_route ON scrape_logs(route);
CREATE INDEX idx_scrape_logs_airline ON scrape_logs(airline);
CREATE INDEX idx_scrape_logs_status ON scrape_logs(status);
```


**Design Notes**:
- Links to parent `scrape_run`
- Tracks individual route/airline attempts
- `attempt_number` supports retry tracking
- `source` identifies scraping method (official site vs aggregator)

#### Table: `flight_prices`
Historical flight price records (append-only).

```sql
CREATE TABLE flight_prices (
    id BIGSERIAL PRIMARY KEY,
    scrape_run_id BIGINT NOT NULL REFERENCES scrape_runs(id) ON DELETE CASCADE,
    scrape_log_id BIGINT NOT NULL REFERENCES scrape_logs(id) ON DELETE CASCADE,
    
    -- Flight Identity
    route VARCHAR(10) NOT NULL,              -- e.g., 'CGK-DPS'
    airline VARCHAR(50) NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    travel_date DATE NOT NULL,
    depart_time TIME NOT NULL,
    arrive_time TIME NULL,
    
    -- Price Data
    price DECIMAL(12, 2) NOT NULL,           -- IDR amount
    currency VARCHAR(3) DEFAULT 'IDR',
    raw_price_label VARCHAR(255) NULL,       -- Original text (e.g., "Rp 1.234.567")
    is_lowest_fare BOOLEAN DEFAULT FALSE,    -- Lowest in this scrape_run
    
    -- Metadata
    scrape_date DATE NOT NULL,               -- When scraped
    source VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_flight_prices_route ON flight_prices(route);
CREATE INDEX idx_flight_prices_airline ON flight_prices(airline);
CREATE INDEX idx_flight_prices_travel_date ON flight_prices(travel_date);
CREATE INDEX idx_flight_prices_scrape_date ON flight_prices(scrape_date);
CREATE INDEX idx_flight_prices_scrape_run_id ON flight_prices(scrape_run_id);
CREATE INDEX idx_flight_prices_is_lowest_fare ON flight_prices(is_lowest_fare);

-- Composite indexes for common queries
CREATE INDEX idx_flight_prices_route_travel_date ON flight_prices(route, travel_date);
CREATE INDEX idx_flight_prices_route_airline_travel ON flight_prices(route, airline, travel_date);
```


**Design Notes**:
- **Append-only**: No updates or deletes
- **Flight Identity**: Combination of route, airline, flight_number, travel_date, depart_time
- **Deduplication**: `is_lowest_fare` flag marks cheapest within same scrape_run
- **raw_price_label**: Preserves original format for debugging
- **Indexes**: Optimized for filtering by route, airline, dates
- **Composite indexes**: Speed up common multi-column queries

### 3.2 Data Relationships

```
scrape_runs (1) ──< (many) scrape_logs
     │
     └──< (many) flight_prices
                    │
scrape_logs (1) ──< (many) flight_prices
```

### 3.3 Master Data (Configuration)

Routes and airlines can be stored as:
1. **Option A**: Configuration arrays in code (simpler)
2. **Option B**: Database tables (more flexible)

**Recommended**: Option A for MVP, migrate to Option B if needed.

**Routes Configuration** (10 routes):
```php
// config/scraping.php
'routes' => [
    'CGK-DPS', 'DPS-CGK',  // Jakarta ↔ Bali
    'CGK-SUB', 'SUB-CGK',  // Jakarta ↔ Surabaya
    'CGK-JOG', 'JOG-CGK',  // Jakarta ↔ Yogyakarta
    'CGK-UPG', 'UPG-CGK',  // Jakarta ↔ Makassar
    'DPS-SUB', 'SUB-DPS',  // Bali ↔ Surabaya
]
```

**Airlines Configuration** (5 airlines):
```php
'airlines' => [
    'garuda' => [
        'name' => 'Garuda Indonesia',
        'source' => 'garuda_official',
        'scraper_class' => GarudaScraper::class,
    ],
    'citilink' => [
        'name' => 'Citilink',
        'source' => 'citilink_official',
        'scraper_class' => CitilinkScraper::class,
    ],
    'lion' => [
        'name' => 'Lion Air',
        'source' => 'bookcabin',
        'scraper_class' => BookcabinScraper::class,
    ],
    'saj' => [
        'name' => 'Super Air Jet',
        'source' => 'bookcabin',
        'scraper_class' => BookcabinScraper::class,
    ],
    'batik' => [
        'name' => 'Batik Air',
        'source' => 'bookcabin',
        'scraper_class' => BookcabinScraper::class,
    ],
]
```


---

## 4. Backend Component Design

### 4.1 Scraper Framework

#### Abstract Scraper Interface

```php
abstract class AbstractScraper
{
    abstract public function scrape(
        string $route, 
        Carbon $travelDate
    ): array;
    
    abstract protected function buildUrl(
        string $route, 
        Carbon $travelDate
    ): string;
    
    abstract protected function parseResponse(
        string $html
    ): array;
    
    protected function makeRequest(string $url): string
    {
        // HTTP client with retry logic
        // User-agent rotation
        // Rate limiting
    }
    
    protected function extractFlightData(array $rawData): array
    {
        // Common extraction logic
        // Validation
        // Normalization
    }
}
```

**Design Rationale**:
- Template method pattern for common scraping flow
- Each airline implements specific parsing logic
- Shared HTTP client configuration
- Centralized error handling

#### Scraper Configuration

```php
// config/scraping.php
return [
    'schedule' => [
        'time' => '07:30',
        'timezone' => 'Asia/Jakarta',
        'end_date' => '2026-03-31',
    ],
    
    'retry' => [
        'max_attempts' => 3,
        'backoff_seconds' => [30, 60, 120], // Exponential
        'retry_window_minutes' => 30,
    ],
    
    'http' => [
        'timeout' => 30,
        'user_agents' => [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
            // Multiple user agents
        ],
        'delay_between_requests' => 2, // seconds
    ],
    
    'validation' => [
        'min_price' => 100000,  // IDR
        'max_price' => 50000000, // IDR
    ],
];
```


### 4.2 Scraping Orchestration

#### ScrapeOrchestrator Service

```php
class ScrapeOrchestrator
{
    public function executeRun(string $runType): ScrapeRun
    {
        // 1. Create scrape_run record
        $run = ScrapeRun::create([
            'run_type' => $runType,
            'status' => 'RUNNING',
            'started_at' => now(),
        ]);
        
        // 2. Calculate date range (today → 2026-03-31)
        $dateRange = $this->calculateDateRange();
        
        // 3. Dispatch jobs for each route × airline
        foreach ($this->getRoutes() as $route) {
            foreach ($this->getAirlines() as $airline) {
                ScrapeFlightPricesJob::dispatch(
                    $run->id,
                    $route,
                    $airline,
                    $dateRange
                );
            }
        }
        
        return $run;
    }
    
    public function updateRunStatus(int $runId): void
    {
        // Check all scrape_logs for this run
        // Update scrape_run status based on results
        // Calculate success/failure counts
    }
}
```

**Design Rationale**:
- Centralized run management
- Decouples orchestration from scraping logic
- Handles status aggregation
- Supports both scheduled and manual runs

### 4.3 Queue Job Design

#### ScrapeFlightPricesJob

```php
class ScrapeFlightPricesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public $tries = 3;
    public $backoff = [30, 60, 120]; // seconds
    
    public function __construct(
        public int $scrapeRunId,
        public string $route,
        public array $airlineConfig,
        public array $dateRange
    ) {}
    
    public function handle(): void
    {
        $log = $this->createScrapeLog();
        
        try {
            $scraper = $this->getScraperInstance();
            $prices = [];
            
            foreach ($this->dateRange as $date) {
                $results = $scraper->scrape($this->route, $date);
                $prices = array_merge($prices, $results);
            }
            
            $validated = $this->validatePrices($prices);
            $deduplicated = $this->deduplicatePrices($validated);
            
            $this->storePrices($deduplicated, $log);
            
            $log->update([
                'status' => 'SUCCESS',
                'prices_collected' => count($deduplicated),
                'finished_at' => now(),
            ]);
            
        } catch (Exception $e) {
            $log->update([
                'status' => 'FAILED',
                'error_message' => $e->getMessage(),
                'finished_at' => now(),
            ]);
            
            throw $e; // Re-throw for retry
        }
    }
}
```


**Design Rationale**:
- One job per route/airline combination
- Built-in retry with exponential backoff
- Creates scrape_log before execution
- Validates and deduplicates before storage
- Graceful failure handling

### 4.4 Data Processing

#### Price Parser & Validator

```php
class PriceParser
{
    public function parse(string $rawPrice): float
    {
        // Remove currency symbols, dots, commas
        // Convert to float
        // Handle various formats: "Rp 1.234.567", "1,234,567", etc.
    }
    
    public function validate(array $priceData): bool
    {
        // Required fields present
        // Price within reasonable range
        // Valid dates (travel_date >= scrape_date)
        // Valid times
    }
}

class PriceDeduplicator
{
    public function deduplicate(array $prices): array
    {
        // Group by flight identity
        // Identity = route + airline + flight_number + travel_date + depart_time
        // Keep lowest price per identity
        // Mark with is_lowest_fare = true
    }
}
```

**Design Rationale**:
- Separate parsing from validation
- Flexible price format handling
- Sanity checks prevent bad data
- Deduplication reduces noise

### 4.5 Scheduling

#### Laravel Scheduler Configuration

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    $schedule->command('scrape:scheduled')
        ->dailyAt('07:30')
        ->timezone('Asia/Jakarta')
        ->onOneServer()
        ->withoutOverlapping()
        ->runInBackground();
}
```

#### ScrapeScheduledCommand

```php
class ScrapeScheduledCommand extends Command
{
    protected $signature = 'scrape:scheduled';
    
    public function handle(ScrapeOrchestrator $orchestrator)
    {
        // Check if end date reached
        if (now()->isAfter('2026-03-31')) {
            $this->info('Scraping period ended');
            return;
        }
        
        $run = $orchestrator->executeRun('scheduled');
        
        $this->info("Scrape run {$run->id} started");
    }
}
```


**Design Rationale**:
- Fixed time execution (07:30 WIB)
- Prevents overlapping runs
- Automatic end date check
- Background execution doesn't block

---

## 5. API Design

### 5.1 API Endpoints

#### Scrape Runs API

```
GET /api/scrape-runs
Query params: page, per_page, run_type, status
Response: Paginated list of scrape runs

GET /api/scrape-runs/{id}
Response: Single run with related logs

POST /api/scrape-runs/manual
Body: { routes?: string[], airlines?: string[] }
Response: Created run object
```

#### Flight Prices API

```
GET /api/flight-prices
Query params:
  - route (optional)
  - airline (optional)
  - travel_date_from (optional)
  - travel_date_to (optional)
  - scrape_date_from (optional)
  - scrape_date_to (optional)
  - is_lowest_fare (optional, boolean)
  - page, per_page
  - sort_by, sort_order
Response: Paginated price records

GET /api/flight-prices/summary
Query params: route, airline, date_range
Response: Aggregated statistics (min, max, avg, count)
```

#### Analytics API

```
GET /api/analytics/price-trends
Query params: route, airline, date_range
Response: Time-series data for charting

GET /api/analytics/cheapest-days
Query params: route, airline
Response: Best days to book analysis

GET /api/analytics/price-comparison
Query params: route, date_range
Response: Airline price comparison

GET /api/analytics/volatility
Query params: route, airline
Response: Price volatility metrics
```

#### Export API

```
GET /api/export/spreadsheet
Query params: route, airline, date_from, date_to, format (xlsx|csv)
Response: File download (streaming)
```


### 5.2 Response Format Standards

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 50,
      "total": 1000,
      "last_page": 20
    }
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": { ... }
  }
}
```

### 5.3 API Design Decisions

**Decision**: RESTful API over GraphQL
**Rationale**: Simpler for single-user system, easier to implement, sufficient for use case

**Decision**: Pagination default 50 records
**Rationale**: Balance between performance and usability

**Decision**: Streaming export for large datasets
**Rationale**: Prevents memory issues with large date ranges

---

## 6. Frontend Design

### 6.1 Component Architecture

```
App
├── Layout
│   ├── Header
│   ├── Sidebar (Navigation)
│   └── Content
├── Pages
│   ├── Dashboard (Overview)
│   ├── ScrapeRuns
│   │   ├── RunsList
│   │   ├── RunDetails
│   │   └── ManualTrigger
│   ├── FlightPrices
│   │   ├── PriceTable
│   │   ├── FilterPanel
│   │   └── PriceDetails
│   ├── Analytics
│   │   ├── PriceTrends (Charts)
│   │   ├── CheapestDays
│   │   └── Comparison
│   └── Export
│       ├── ExportConfig
│       └── DownloadHandler
└── Shared Components
    ├── Table (sortable, filterable)
    ├── DateRangePicker
    ├── Select (multi-select)
    ├── Modal
    ├── Button
    ├── Badge (status indicators)
    └── LoadingSpinner
```


### 6.2 State Management

**Approach**: React Context + Hooks (no Redux needed)

```typescript
// Contexts
- AuthContext (if auth added later)
- FilterContext (shared filter state)
- NotificationContext (toast messages)

// Custom Hooks
- useApi (API calls with loading/error states)
- usePagination (pagination logic)
- useFilters (filter state management)
- usePolling (real-time status updates)
```

**Design Rationale**:
- Simple state management for single-user app
- Context API sufficient for shared state
- Custom hooks encapsulate reusable logic
- No need for complex state management library

### 6.3 Key UI Features

#### Manual Scraping Trigger
```typescript
// User flow:
1. Click "Take Data" button
2. Confirmation modal appears
3. Optional: Select specific routes/airlines
4. Submit → API call
5. Show loading state
6. Poll for status updates
7. Display success/failure notification
```

#### Real-time Status Monitoring
```typescript
// Polling mechanism:
- Poll /api/scrape-runs/{id} every 5 seconds
- Update UI with current status
- Show per-route progress
- Stop polling when run completes
```

#### Price Table with Filters
```typescript
// Filter options:
- Route (multi-select dropdown)
- Airline (multi-select dropdown)
- Travel date range (date picker)
- Scrape date range (date picker)
- Lowest fare only (checkbox)

// Table features:
- Sortable columns
- Pagination
- Price formatting (IDR)
- Status badges
```

### 6.4 Charting Library

**Choice**: Recharts
**Rationale**:
- React-native charting
- Good documentation
- Sufficient for time-series and comparison charts
- Lightweight

**Alternative**: Chart.js (if more customization needed)


---

## 7. Error Handling & Resilience

### 7.1 Scraping Error Scenarios

#### Scenario 1: Website Structure Changed
**Detection**: Parser fails to extract expected data
**Handling**:
- Log error with raw HTML/response
- Mark scrape_log as FAILED
- Continue with other routes/airlines
- Alert for manual investigation

#### Scenario 2: Rate Limiting / IP Block
**Detection**: HTTP 429 or repeated timeouts
**Handling**:
- Exponential backoff retry
- Rotate user agents
- Spread requests over time window
- Log for monitoring

#### Scenario 3: Network Timeout
**Detection**: HTTP client timeout
**Handling**:
- Retry with backoff (max 3 attempts)
- Log attempt number
- Mark as FAILED after max retries

#### Scenario 4: Invalid Data Returned
**Detection**: Validation fails
**Handling**:
- Log validation errors
- Skip invalid records
- Continue processing valid records
- Track validation failure rate

### 7.2 Retry Strategy

```php
// Job retry configuration
public $tries = 3;
public $backoff = [30, 60, 120]; // seconds

// Retry logic:
Attempt 1: Immediate execution
Attempt 2: Wait 30 seconds
Attempt 3: Wait 60 seconds
Attempt 4: Wait 120 seconds
After 4 attempts: Mark as permanently failed
```

**Design Rationale**:
- Exponential backoff reduces server load
- 3 retries handle transient failures
- Permanent failure after retries prevents infinite loops

### 7.3 Partial Failure Handling

```php
// Run status determination:
- SUCCESS: All routes/airlines succeeded
- PARTIAL: Some succeeded, some failed
- FAILED: All routes/airlines failed

// Partial success is acceptable:
- Store successful data
- Log failures for investigation
- Don't block entire run
```


### 7.4 Logging Strategy

```php
// Log levels:
- ERROR: Scraping failures, validation errors
- WARNING: Retries, partial failures
- INFO: Successful scrapes, run completion
- DEBUG: Detailed scraping steps (dev only)

// Log channels:
- daily: Rotating daily logs
- database: scrape_logs table
- slack: Critical failures (optional)
```

---

## 8. Export Feature Design

### 8.1 Export Format

**Spreadsheet Structure** (Excel/CSV):
```
Sheet per route (e.g., "CGK-DPS")
Columns:
- Scrape Date
- Travel Date
- Airline
- Flight Number
- Departure Time
- Arrival Time
- Price (IDR)
- Is Lowest Fare
- Source
```

### 8.2 Export Implementation

```php
class ExportService
{
    public function generateSpreadsheet(
        array $filters,
        string $format
    ): StreamedResponse {
        // Query flight_prices with filters
        // Group by route
        // Create sheet per route
        // Stream to response (memory efficient)
    }
}
```

**Design Rationale**:
- Per-route sheets for easy analysis
- Streaming prevents memory issues
- Include scrape_date for time-series analysis
- Support both Excel and CSV

### 8.3 Export UI Flow

```
1. User selects filters (route, airline, date range)
2. User clicks "Export" button
3. Frontend shows loading state
4. API generates file (streaming)
5. Browser downloads file
6. Success notification
```

---

## 9. Deployment Architecture

### 9.1 Docker Compose Setup

```yaml
services:
  app:
    build: .
    depends_on:
      - db
    environment:
      - DB_CONNECTION=pgsql
      - QUEUE_CONNECTION=database
  
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  nginx:
    image: nginx:alpine
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
  
  scheduler:
    build: .
    command: php artisan schedule:work
    depends_on:
      - db
  
  queue:
    build: .
    command: php artisan queue:work --tries=3
    depends_on:
      - db
```


### 9.2 Environment Configuration

```env
# Application
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Asia/Jakarta

# Database
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=flight_prices
DB_USERNAME=postgres
DB_PASSWORD=secure_password

# Queue
QUEUE_CONNECTION=database

# Scraping
SCRAPE_SCHEDULE_TIME=07:30
SCRAPE_END_DATE=2026-03-31
SCRAPE_MAX_RETRIES=3
```

### 9.3 VPS Requirements

**Minimum Specs**:
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 22.04 LTS

**Rationale**:
- Sufficient for daily scraping workload
- PostgreSQL + Laravel + Queue worker
- Room for data growth until March 2026

---

## 10. Performance Considerations

### 10.1 Database Optimization

**Indexing Strategy**:
- Index all filter columns (route, airline, dates)
- Composite indexes for common query patterns
- Monitor slow queries with EXPLAIN

**Query Optimization**:
- Pagination on all list endpoints
- Eager loading relationships
- Select only needed columns
- Use database aggregations for analytics

### 10.2 API Performance

**Caching Strategy**:
```php
// Cache master data (routes, airlines)
Cache::remember('routes', 3600, fn() => $this->getRoutes());

// Cache analytics results (5 minutes)
Cache::remember("analytics:{$route}:{$date}", 300, fn() => ...);
```

**Pagination**:
- Default: 50 records per page
- Max: 200 records per page
- Cursor pagination for large datasets (future)

### 10.3 Scraping Performance

**Concurrency**:
- Queue workers: 2-3 concurrent jobs
- Rate limiting: 2 seconds between requests
- Timeout: 30 seconds per request

**Design Rationale**:
- Balance between speed and politeness
- Avoid overwhelming airline websites
- Prevent IP blocking


---

## 11. Security Considerations

### 11.1 API Security

**Authentication** (Future):
- Simple token-based auth
- Single user credentials
- Optional: IP whitelist

**Rate Limiting**:
```php
// Throttle API endpoints
Route::middleware('throttle:60,1')->group(function () {
    // API routes
});
```

### 11.2 Scraping Security

**User Agent Rotation**:
- Multiple realistic user agents
- Rotate per request
- Avoid bot detection

**Respectful Scraping**:
- Honor robots.txt
- Implement delays between requests
- Monitor for rate limiting responses
- Graceful backoff on errors

### 11.3 Data Security

**Environment Variables**:
- All secrets in .env
- Never commit .env to git
- Use strong database passwords

**Database Backups**:
- Daily automated backups
- Store offsite (S3 or similar)
- Test restore procedures

---

## 12. Monitoring & Observability

### 12.1 Health Checks

```php
// Health check endpoint
GET /api/health
Response:
{
  "status": "healthy",
  "database": "connected",
  "queue": "running",
  "last_scrape": "2026-01-30 07:30:00",
  "disk_space": "45GB free"
}
```

### 12.2 Metrics to Monitor

**Scraping Metrics**:
- Daily scrape success rate
- Average prices collected per run
- Failed routes/airlines
- Retry frequency

**System Metrics**:
- Database size growth
- Queue job processing time
- API response times
- Error rates

### 12.3 Alerting (Optional)

**Critical Alerts**:
- Scheduled scrape failed completely
- Database connection lost
- Disk space < 10GB

**Warning Alerts**:
- Partial scrape failure (>30% routes failed)
- Queue backlog > 100 jobs
- Slow API responses (>2s)


---

## 13. Testing Strategy

### 13.1 Backend Testing

**Unit Tests**:
- Scraper parsing logic
- Price validation
- Deduplication logic
- Date range calculations

**Integration Tests**:
- Job execution flow
- Database operations
- API endpoints
- Orchestrator logic

**Scraper Tests**:
- Mock HTTP responses
- Test various HTML structures
- Validate error handling
- Test retry logic

### 13.2 Frontend Testing

**Component Tests**:
- UI component rendering
- User interactions
- Filter logic
- Form validation

**Integration Tests**:
- API integration
- Routing
- State management
- Export functionality

### 13.3 Manual Testing

**Scraping Tests**:
- Test each airline scraper manually
- Verify data accuracy
- Check error handling
- Validate deduplication

**End-to-End Tests**:
- Complete scraping flow
- Manual trigger
- Export generation
- Analytics accuracy

---

## 14. Data Migration & Seeding

### 14.1 Initial Setup

```php
// Database migrations
php artisan migrate

// Seed master data (if using DB tables)
php artisan db:seed --class=RoutesSeeder
php artisan db:seed --class=AirlinesSeeder
```

### 14.2 Data Backup Strategy

**Daily Backups**:
```bash
# PostgreSQL dump
pg_dump -U postgres flight_prices > backup_$(date +%Y%m%d).sql

# Compress and upload to S3/storage
gzip backup_$(date +%Y%m%d).sql
# Upload to cloud storage
```

**Retention Policy**:
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep until project end


---

## 15. Future Enhancements

### 15.1 Post-MVP Features

**Analytics Enhancements**:
- Price forecasting using historical trends
- Anomaly detection for unusual spikes
- Booking recommendation engine
- Seasonal pattern analysis
- Airline pricing strategy insights

**Operational Improvements**:
- Email/SMS alerts for price drops
- Configurable alert thresholds per route
- Multi-user support with roles
- API rate limiting for external access
- Webhook support for integrations

**Data Extensions**:
- Seat availability tracking
- Flight duration tracking
- Layover information
- Baggage allowance tracking
- Promo code effectiveness

**Infrastructure**:
- Redis for caching and faster queues
- Elasticsearch for advanced search
- Grafana dashboards for monitoring
- Automated cloud backups
- CI/CD pipeline

**UI/UX**:
- Mobile-responsive design
- Dark mode
- Customizable dashboards
- Saved filter presets
- Shareable report links
- PDF report generation

### 15.2 Scalability Considerations

**If Expanding to Multi-User**:
- Horizontal scaling with load balancer
- Database read replicas
- Separate scraping workers
- Message queue (RabbitMQ/SQS)
- CDN for frontend assets
- Microservices architecture

---

## 16. Development Phases & Priorities

### Phase 1: Foundation & Core Scraping (MVP)
**Duration**: 2-3 weeks
**Priority**: MUST-HAVE

**Deliverables**:
- Database schema implemented
- Scraper framework established
- 2 airlines working (Garuda, Citilink)
- Basic API endpoints
- Scheduled scraping functional

**Success Criteria**:
- Can scrape 2 airlines daily
- Data stored correctly in database
- Scheduled execution works


### Phase 2: Complete Scraping Coverage
**Duration**: 2 weeks
**Priority**: MUST-HAVE

**Deliverables**:
- All 5 airlines scrapers implemented
- All 10 routes configured
- Retry logic & error handling
- Manual trigger capability
- Run status tracking

**Success Criteria**:
- All airlines scraping successfully
- Partial failures handled gracefully
- Manual trigger works from API

### Phase 3: Dashboard & Visualization
**Duration**: 2-3 weeks
**Priority**: MUST-HAVE

**Deliverables**:
- React dashboard with data tables
- Route/airline filtering
- Run history view
- Basic price trend charts
- Manual scraping UI

**Success Criteria**:
- User can view all historical data
- Filters work correctly
- Manual scraping triggered from UI
- Charts display price trends

### Phase 4: Export & Analytics
**Duration**: 1-2 weeks
**Priority**: MUST-HAVE

**Deliverables**:
- Spreadsheet export (per route/airline)
- Price trend analysis
- Cheapest day indicators
- Price spike detection
- Booking window analysis

**Success Criteria**:
- Export generates correct spreadsheets
- Analytics provide actionable insights
- Performance acceptable for large datasets

### Phase 5: Production Hardening
**Duration**: 1 week
**Priority**: MUST-HAVE

**Deliverables**:
- Docker production configuration
- Monitoring & logging
- Backup strategy
- Documentation
- VPS deployment guide

**Success Criteria**:
- System runs reliably on VPS
- Monitoring alerts work
- Backups automated
- Documentation complete

---

## 17. Risk Mitigation

### Risk 1: Website Structure Changes
**Impact**: High - scrapers break
**Probability**: Medium

**Mitigation**:
- Abstract scraper interface for easy updates
- Comprehensive error logging
- Graceful degradation (partial failures OK)
- Monitor scrape success rates
- Keep raw HTML/JSON for debugging


### Risk 2: Rate Limiting / IP Blocking
**Impact**: High - no data collection
**Probability**: Medium

**Mitigation**:
- Polite scraping with delays
- User-agent rotation
- Respect robots.txt
- Proxy rotation (if needed)
- Spread scraping across time window

### Risk 3: Data Volume Growth
**Impact**: Medium - database size, query performance
**Probability**: High (by design)

**Mitigation**:
- Database indexing on query columns
- Pagination on all endpoints
- Consider partitioning by scrape_date (future)
- Regular database maintenance
- Archive old data after March 2026

### Risk 4: Scraping Failures During Critical Periods
**Impact**: Medium - missing data points
**Probability**: Medium

**Mitigation**:
- Retry logic with exponential backoff
- Manual trigger capability
- Alert on consecutive failures
- Partial success handling
- Document manual recovery procedures

### Risk 5: VPS Resource Constraints
**Impact**: Medium - slow performance, OOM
**Probability**: Low-Medium

**Mitigation**:
- Database-backed queue (not memory-intensive)
- Limit concurrent scraping jobs
- Monitor resource usage
- Optimize database queries
- Consider vertical scaling if needed

### Risk 6: Time Zone Issues
**Impact**: Low - incorrect scheduling
**Probability**: Low

**Mitigation**:
- Explicit timezone configuration (Asia/Jakarta)
- Use Carbon for date/time handling
- Test scheduling thoroughly
- Document timezone assumptions

---

## 18. Success Metrics

### 18.1 Technical Metrics

**Scraping Reliability**:
- Target: >95% daily scrape success rate
- Measure: successful_routes / total_routes per run

**Data Quality**:
- Target: <1% validation failures
- Measure: failed validations / total records

**System Performance**:
- API response time: <500ms (p95)
- Scraping duration: <30 minutes per run
- Database query time: <100ms (p95)


### 18.2 Business Metrics

**Data Collection**:
- Target: 400+ days of historical data (until March 31, 2026)
- Coverage: All 10 routes × 5 airlines = 50 combinations
- Estimated records: ~500,000+ price points

**Analytical Value**:
- Identify cheapest booking windows
- Track airline pricing strategies
- Detect seasonal patterns
- Provide booking recommendations

---

## 19. Documentation Requirements

### 19.1 Technical Documentation

**Architecture Documentation**:
- System architecture diagram
- Database schema diagram
- API documentation (OpenAPI/Swagger)
- Deployment guide

**Code Documentation**:
- Inline code comments
- PHPDoc for classes/methods
- TypeScript interfaces documented
- README files per module

### 19.2 Operational Documentation

**Deployment Guide**:
- VPS setup instructions
- Docker Compose configuration
- Environment variable reference
- SSL certificate setup

**Maintenance Guide**:
- Database backup/restore procedures
- Scraper update process
- Troubleshooting common issues
- Monitoring dashboard setup

**User Guide**:
- Dashboard navigation
- Filter usage
- Export functionality
- Manual scraping trigger

---

## 20. Acceptance Criteria

### 20.1 MVP Acceptance Criteria

**Backend**:
- ✓ Database schema implemented and migrated
- ✓ All 5 airline scrapers functional
- ✓ Scheduled scraping runs daily at 07:30 WIB
- ✓ Manual trigger API works
- ✓ Data validation and deduplication working
- ✓ Error handling and retry logic implemented
- ✓ All API endpoints functional

**Frontend**:
- ✓ Dashboard displays scrape runs
- ✓ Price table with filtering works
- ✓ Manual scraping trigger UI functional
- ✓ Export generates correct spreadsheets
- ✓ Basic analytics charts display

**Infrastructure**:
- ✓ Docker Compose setup complete
- ✓ Deployed to VPS successfully
- ✓ Scheduled scraping runs automatically
- ✓ Backups automated


### 20.2 Quality Criteria

**Reliability**:
- System runs continuously without manual intervention
- Handles failures gracefully
- Recovers from transient errors automatically

**Performance**:
- Scraping completes within 30 minutes
- API responses under 500ms
- Dashboard loads under 2 seconds

**Maintainability**:
- Code follows Laravel/React best practices
- Clear separation of concerns
- Easy to add new airlines/routes
- Comprehensive error logging

**Data Integrity**:
- No duplicate records (within same run)
- All required fields populated
- Price data validated
- Historical data preserved

---

## 21. Glossary

**Scrape Run**: A single execution of the scraping process (scheduled or manual)

**Flight Identity**: Unique combination of route, airline, flight_number, travel_date, and depart_time

**Lowest Fare**: The cheapest price for a given flight identity within a single scrape run

**Route**: Origin-destination pair (e.g., CGK-DPS)

**Source**: The website or API from which data is scraped (e.g., garuda_official, bookcabin)

**Travel Date**: The date of the actual flight

**Scrape Date**: The date when the price was collected

**Deduplication**: Process of keeping only the lowest fare per flight identity within a scrape run

**Partial Failure**: When some routes/airlines succeed but others fail in a scrape run

**Run Type**: Classification of scrape run as 'scheduled' or 'manual'

---

## 22. Appendix

### 22.1 Technology Justifications

**Laravel**: 
- Mature PHP framework with excellent queue system
- Built-in scheduler for cron jobs
- Eloquent ORM simplifies database operations
- Large ecosystem and community

**React + Vite**:
- Fast development with hot module replacement
- TypeScript support for type safety
- Modern build tooling
- Component-based architecture

**PostgreSQL**:
- Robust relational database
- Excellent for time-series data
- Advanced indexing capabilities
- JSON support for flexible data

**Docker Compose**:
- Simple orchestration for small deployments
- Reproducible environments
- Easy VPS deployment
- No Kubernetes complexity needed


### 22.2 Configuration Reference

**Routes** (10 total):
```
CGK-DPS (Jakarta → Bali)
DPS-CGK (Bali → Jakarta)
CGK-SUB (Jakarta → Surabaya)
SUB-CGK (Surabaya → Jakarta)
CGK-JOG (Jakarta → Yogyakarta)
JOG-CGK (Yogyakarta → Jakarta)
CGK-UPG (Jakarta → Makassar)
UPG-CGK (Makassar → Jakarta)
DPS-SUB (Bali → Surabaya)
SUB-DPS (Surabaya → Bali)
```

**Airlines** (5 total):
```
1. Garuda Indonesia (garuda_official)
2. Citilink (citilink_official)
3. Lion Air (bookcabin)
4. Super Air Jet (bookcabin)
5. Batik Air (bookcabin)
```

**Scraping Schedule**:
- Time: 07:30 WIB (Asia/Jakarta)
- Frequency: Daily
- End Date: March 31, 2026
- Date Range: Today → March 31, 2026

### 22.3 Database Size Estimates

**Assumptions**:
- 10 routes × 5 airlines = 50 combinations
- ~10 flights per route/airline/day average
- ~400 days of collection (until March 2026)
- ~200,000 price records total

**Storage Estimate**:
- flight_prices: ~200,000 rows × 500 bytes = ~100 MB
- scrape_runs: ~400 rows × 200 bytes = ~80 KB
- scrape_logs: ~20,000 rows × 300 bytes = ~6 MB
- Indexes: ~50 MB
- **Total**: ~200 MB (well within VPS capacity)

### 22.4 API Rate Limiting

**Recommended Limits**:
- Anonymous: 60 requests/minute
- Authenticated: 120 requests/minute (future)
- Export: 10 requests/hour (resource-intensive)

---

## 23. Conclusion

This design document provides a comprehensive blueprint for building a reliable, maintainable flight price monitoring platform. The architecture prioritizes:

1. **Data Integrity**: Append-only model ensures historical accuracy
2. **Resilience**: Graceful handling of partial failures
3. **Simplicity**: Appropriate complexity for single-user system
4. **Maintainability**: Clear structure for future updates
5. **Performance**: Optimized for daily scraping workload

The phased development approach allows for incremental delivery of value, with the MVP focusing on core scraping functionality before adding analytical features. The system is designed to run reliably on a small VPS until March 31, 2026, collecting valuable time-series data for flight price analysis.

Key success factors:
- Robust error handling and retry logic
- Comprehensive logging for debugging
- Flexible scraper architecture for easy updates
- Efficient database design with proper indexing
- User-friendly dashboard for data exploration

The design balances technical excellence with pragmatic simplicity, avoiding over-engineering while ensuring the system can reliably collect and analyze flight price data over the 14-month collection period.
