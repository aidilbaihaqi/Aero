# Flight Price Monitoring Platform - Development Plan

## Architecture Overview

### System Purpose
Time-series flight price monitoring platform that scrapes airline prices daily, stores historical data, and provides analytics for price trend analysis. Single-user system optimized for VPS deployment.

### Core Architecture Components

**Backend (Laravel)**
- RESTful API server
- Scheduled scraping orchestrator (Laravel Scheduler)
- Queue-based job processing (database-backed)
- Scraper services (per airline/source)
- Data persistence layer (PostgreSQL)

**Frontend (React)**
- SPA dashboard for data visualization
- Manual scraping trigger interface
- Export functionality
- Real-time status monitoring

**Infrastructure**
- Docker Compose orchestration
- PostgreSQL database
- Nginx reverse proxy
- Cron for Laravel Scheduler

### Data Flow Architecture

```
Scheduler (07:30 WIB) → Scrape Job → Parser → Validator → Database
                                                              ↓
User Manual Trigger → Scrape Job → Parser → Validator → Database
                                                              ↓
                                                    API ← Frontend
                                                              ↓
                                                         Export Service
```

### Key Design Decisions

1. **Database-backed queue** (not Redis) - simpler ops, sufficient for daily scraping
2. **Append-only data model** - preserves historical integrity
3. **Per-route scraping isolation** - partial failures don't block entire run
4. **Lowest fare deduplication** - within single run, same flight identity
5. **Separate run tracking** - scheduled vs manual runs tracked independently

---

## Development Phases

### Phase 1: Foundation & Core Scraping (MVP)
**Goal**: Get basic scraping working with data persistence
**Duration**: 2-3 weeks
**Deliverables**:
- Database schema implemented
- Scraper framework established
- At least 2 airlines working (Garuda, Citilink)
- Basic API endpoints
- Scheduled scraping functional

### Phase 2: Complete Scraping Coverage
**Goal**: All airlines and routes operational
**Duration**: 2 weeks
**Deliverables**:
- All 5 airlines scrapers implemented
- All 10 routes configured
- Retry logic & error handling
- Manual trigger capability
- Run status tracking

### Phase 3: Dashboard & Visualization
**Goal**: User interface for monitoring and analysis
**Duration**: 2-3 weeks
**Deliverables**:
- React dashboard with data tables
- Route/airline filtering
- Run history view
- Basic price trend charts
- Manual scraping UI

### Phase 4: Export & Analytics
**Goal**: Data export and analytical features
**Duration**: 1-2 weeks
**Deliverables**:
- Spreadsheet export (per route/airline)
- Price trend analysis
- Cheapest day indicators
- Price spike detection
- Booking window analysis

### Phase 5: Production Hardening
**Goal**: Deployment-ready system
**Duration**: 1 week
**Deliverables**:
- Docker production configuration
- Monitoring & logging
- Backup strategy
- Documentation
- VPS deployment guide

---

## Backend Task Breakdown

### 1. Database & Models (Phase 1 - MVP)

#### 1.1 Create Database Migrations
**Goal**: Implement complete database schema
**Components**:
- `scrape_runs` table
- `scrape_logs` table
- `flight_prices` table
- Optional: `routes` and `airlines` master tables
**Prerequisites**: None
**Priority**: MUST-HAVE

#### 1.2 Create Eloquent Models
**Goal**: ORM models with relationships
**Components**:
- `ScrapeRun` model
- `ScrapeLog` model
- `FlightPrice` model
- Model relationships (hasMany, belongsTo)
**Prerequisites**: 1.1
**Priority**: MUST-HAVE

#### 1.3 Database Seeders
**Goal**: Seed master data (routes, airlines)
**Components**:
- Routes seeder (10 routes)
- Airlines seeder (5 airlines with source types)
**Prerequisites**: 1.1
**Priority**: MUST-HAVE

### 2. Scraper Framework (Phase 1 - MVP)

#### 2.1 Abstract Scraper Service
**Goal**: Base scraper interface and common logic
**Components**:
- `AbstractScraper` base class
- HTTP client configuration
- Rate limiting logic
- Error handling framework
- Response parsing interface
**Prerequisites**: None
**Priority**: MUST-HAVE

#### 2.2 Scraper Configuration System
**Goal**: Centralized scraper configuration
**Components**:
- Config file for routes/airlines mapping
- Source URL templates
- Scraping parameters (date ranges, retry limits)
**Prerequisites**: None
**Priority**: MUST-HAVE

#### 2.3 Price Parser & Validator
**Goal**: Extract and validate price data
**Components**:
- Price extraction logic (handle various formats)
- Currency normalization
- Data validation rules
- Lowest fare detection within run
**Prerequisites**: 2.1
**Priority**: MUST-HAVE

### 3. Airline-Specific Scrapers (Phase 1-2)

#### 3.1 Garuda Indonesia Scraper
**Goal**: Scrape Garuda official website
**Components**:
- HTTP client for Garuda website
- DOM parser / API client
- Flight data extraction
- Basic fare isolation
**Prerequisites**: 2.1, 2.2
**Priority**: MUST-HAVE (Phase 1)

#### 3.2 Citilink Scraper
**Goal**: Scrape Citilink official website
**Components**:
- HTTP client for Citilink website
- DOM parser / API client
- Flight data extraction
- Basic fare isolation
**Prerequisites**: 2.1, 2.2
**Priority**: MUST-HAVE (Phase 1)

#### 3.3 Bookcabin Scraper (Lion Air, Super Air Jet, Batik Air)
**Goal**: Scrape Bookcabin.com for 3 airlines
**Components**:
- HTTP client for Bookcabin
- Airline-specific selectors
- Multi-airline handling
- Flight data extraction
**Prerequisites**: 2.1, 2.2
**Priority**: MUST-HAVE (Phase 2)

### 4. Job Queue System (Phase 1-2)

#### 4.1 Scrape Job Implementation
**Goal**: Queueable job for scraping execution
**Components**:
- `ScrapeFlightPricesJob` job class
- Job parameters (route, airline, date range)
- Job failure handling
- Job retry logic (max 3 attempts)
**Prerequisites**: 2.1, 3.1, 3.2
**Priority**: MUST-HAVE

#### 4.2 Run Orchestrator
**Goal**: Coordinate multi-route scraping
**Components**:
- `ScrapeOrchestrator` service
- Create `scrape_runs` record
- Dispatch jobs per route/airline
- Track run completion
- Update run status (SUCCESS/PARTIAL/FAILED)
**Prerequisites**: 4.1
**Priority**: MUST-HAVE

#### 4.3 Scheduled Command
**Goal**: Laravel command for scheduled execution
**Components**:
- `ScrapeScheduledCommand` artisan command
- Schedule configuration (07:30 WIB daily)
- Date range calculation (today → 31 Mar 2026)
- Trigger orchestrator
**Prerequisites**: 4.2
**Priority**: MUST-HAVE

### 5. API Endpoints (Phase 2-3)

#### 5.1 Scrape Runs API
**Goal**: CRUD operations for scrape runs
**Components**:
- `GET /api/scrape-runs` - list runs with pagination
- `GET /api/scrape-runs/{id}` - run details
- `POST /api/scrape-runs/manual` - trigger manual run
**Prerequisites**: 4.2
**Priority**: MUST-HAVE

#### 5.2 Flight Prices API
**Goal**: Query historical price data
**Components**:
- `GET /api/flight-prices` - list with filters
- Query params: route, airline, date_from, date_to, scrape_date
- Pagination support
- Sorting options
**Prerequisites**: 1.2
**Priority**: MUST-HAVE

#### 5.3 Analytics API
**Goal**: Aggregated data endpoints
**Components**:
- `GET /api/analytics/price-trends` - time-series data
- `GET /api/analytics/cheapest-days` - best booking days
- `GET /api/analytics/price-comparison` - airline comparison
- `GET /api/analytics/volatility` - price volatility metrics
**Prerequisites**: 5.2
**Priority**: NICE-TO-HAVE (Phase 4)

#### 5.4 Export API
**Goal**: Generate spreadsheet exports
**Components**:
- `GET /api/export/spreadsheet` - generate Excel/CSV
- Per-route/airline sheet generation
- Include scrape_date column
- Streaming response for large datasets
**Prerequisites**: 5.2
**Priority**: MUST-HAVE (Phase 4)

### 6. Error Handling & Logging (Phase 2)

#### 6.1 Scrape Log Repository
**Goal**: Persist scraping logs
**Components**:
- `ScrapeLogRepository` class
- Log creation per route/airline
- Status tracking (SUCCESS/FAILED)
- Error reason storage
**Prerequisites**: 1.2
**Priority**: MUST-HAVE

#### 6.2 Retry & Backoff Logic
**Goal**: Handle transient failures
**Components**:
- Exponential backoff strategy
- Max retry limit (3 attempts)
- Retry window (07:30 - 08:00 WIB)
- Partial failure handling
**Prerequisites**: 4.1
**Priority**: MUST-HAVE

#### 6.3 Monitoring & Alerts
**Goal**: System health monitoring
**Components**:
- Laravel log channels configuration
- Failed job tracking
- Daily scrape success rate monitoring
- Optional: email alerts for failures
**Prerequisites**: 6.1
**Priority**: NICE-TO-HAVE (Phase 5)

### 7. Data Integrity (Phase 2)

#### 7.1 Deduplication Logic
**Goal**: Ensure lowest fare per flight identity
**Components**:
- Flight identity calculation (route + airline + flight_number + travel_date + depart_time)
- Within-run deduplication
- `is_lowest_fare` flag setting
**Prerequisites**: 2.3
**Priority**: MUST-HAVE

#### 7.2 Data Validation Service
**Goal**: Validate scraped data before persistence
**Components**:
- Required field validation
- Price range validation (sanity checks)
- Date validation (travel_date >= scrape_date)
- Currency validation
**Prerequisites**: 2.3
**Priority**: MUST-HAVE

---

## Frontend Task Breakdown

### 1. Project Setup (Phase 3)

#### 1.1 React + Vite Configuration
**Goal**: Initialize frontend project
**Components**:
- Vite configuration
- TypeScript setup
- Tailwind CSS integration
- API client configuration (Axios/Fetch)
**Prerequisites**: None
**Priority**: MUST-HAVE

#### 1.2 Routing Setup
**Goal**: Client-side routing
**Components**:
- React Router configuration
- Route definitions (Dashboard, Runs, Export)
- Layout components
**Prerequisites**: 1.1
**Priority**: MUST-HAVE

#### 1.3 UI Component Library
**Goal**: Reusable UI components
**Components**:
- Button, Input, Select components
- Table component with sorting/filtering
- Modal/Dialog component
- Loading states & spinners
- Alert/Toast notifications
**Prerequisites**: 1.1
**Priority**: MUST-HAVE

### 2. Dashboard Pages (Phase 3)

#### 2.1 Scrape Runs Page
**Goal**: View scraping history
**Components**:
- Runs list table (run_type, status, started_at, finished_at)
- Status badges (SUCCESS/PARTIAL/FAILED)
- Run details modal
- Manual scrape trigger button
**Prerequisites**: 1.2, 1.3
**Priority**: MUST-HAVE

#### 2.2 Flight Prices Page
**Goal**: Browse historical price data
**Components**:
- Price data table with pagination
- Filter panel (route, airline, date range)
- Sort functionality
- Price formatting (IDR currency)
**Prerequisites**: 1.2, 1.3
**Priority**: MUST-HAVE

#### 2.3 Analytics Dashboard
**Goal**: Visual price analysis
**Components**:
- Price trend line charts (Chart.js / Recharts)
- Airline comparison charts
- Cheapest day indicators
- Price spike highlights
**Prerequisites**: 2.2
**Priority**: NICE-TO-HAVE (Phase 4)

### 3. Manual Scraping Feature (Phase 3)

#### 3.1 Manual Trigger UI
**Goal**: User-initiated scraping
**Components**:
- "Take Data" button
- Confirmation modal
- Progress indicator
- Success/failure notification
**Prerequisites**: 2.1
**Priority**: MUST-HAVE

#### 3.2 Real-time Status Updates
**Goal**: Show scraping progress
**Components**:
- Polling mechanism for run status
- Per-route status indicators
- Error display
**Prerequisites**: 3.1
**Priority**: NICE-TO-HAVE

### 4. Export Feature (Phase 4)

#### 4.1 Export Configuration UI
**Goal**: Configure export parameters
**Components**:
- Route/airline selection
- Date range picker
- Export format selection (Excel/CSV)
- Export button
**Prerequisites**: 1.3
**Priority**: MUST-HAVE

#### 4.2 Export Download Handler
**Goal**: Handle file download
**Components**:
- API call to export endpoint
- File download trigger
- Loading state during generation
- Error handling
**Prerequisites**: 4.1
**Priority**: MUST-HAVE

### 5. Filtering & Search (Phase 3)

#### 5.1 Filter Components
**Goal**: Reusable filter UI
**Components**:
- Route dropdown (multi-select)
- Airline dropdown (multi-select)
- Date range picker
- Apply/Reset buttons
**Prerequisites**: 1.3
**Priority**: MUST-HAVE

#### 5.2 Filter State Management
**Goal**: Manage filter state
**Components**:
- URL query params sync
- Filter persistence
- Clear filters functionality
**Prerequisites**: 5.1
**Priority**: MUST-HAVE

### 6. Data Visualization (Phase 4)

#### 6.1 Price Trend Charts
**Goal**: Visualize price changes over time
**Components**:
- Line chart component
- Multi-airline comparison
- Date range selection
- Interactive tooltips
**Prerequisites**: 2.3
**Priority**: NICE-TO-HAVE

#### 6.2 Statistical Summaries
**Goal**: Display key metrics
**Components**:
- Min/max/avg price cards
- Price change indicators
- Volatility metrics
- Best booking window
**Prerequisites**: 2.3
**Priority**: NICE-TO-HAVE

---

## Execution Timeline (Suggested Order)

### Week 1-2: Backend Foundation
1. Database migrations & models (1.1, 1.2, 1.3)
2. Abstract scraper framework (2.1, 2.2, 2.3)
3. First airline scraper - Garuda (3.1)
4. Basic job queue (4.1)

**Milestone**: Can scrape Garuda and store data

### Week 3: Complete Core Scraping
5. Second airline scraper - Citilink (3.2)
6. Run orchestrator (4.2)
7. Scheduled command (4.3)
8. Error handling & logging (6.1, 6.2)

**Milestone**: Scheduled scraping works for 2 airlines

### Week 4-5: Expand Coverage
9. Bookcabin scraper (3.3)
10. Data validation (7.1, 7.2)
11. Basic API endpoints (5.1, 5.2)
12. Manual trigger API (5.1)

**Milestone**: All airlines operational, API ready

### Week 6-7: Frontend Dashboard
13. React project setup (1.1, 1.2, 1.3)
14. Scrape runs page (2.1)
15. Flight prices page (2.2)
16. Manual trigger UI (3.1)
17. Filtering (5.1, 5.2)

**Milestone**: Functional dashboard with manual scraping

### Week 8: Export & Analytics
18. Export API (5.4)
19. Export UI (4.1, 4.2)
20. Analytics API (5.3)
21. Basic charts (6.1)

**Milestone**: Complete MVP with export

### Week 9: Production Prep
22. Docker configuration
23. Monitoring setup (6.3)
24. Documentation
25. VPS deployment
26. Testing & bug fixes

**Milestone**: Production-ready system

---

## Risks & Mitigation

### Risk 1: Website Structure Changes
**Impact**: High - scrapers break
**Probability**: Medium
**Mitigation**:
- Abstract scraper interface for easy updates
- Comprehensive error logging
- Graceful degradation (partial failures OK)
- Monitor scrape success rates
- Keep raw HTML/JSON responses for debugging

### Risk 2: Rate Limiting / IP Blocking
**Impact**: High - no data collection
**Probability**: Medium
**Mitigation**:
- Implement polite scraping (delays between requests)
- User-agent rotation
- Respect robots.txt
- Consider proxy rotation (if needed)
- Spread scraping across time window (07:30-08:00)

### Risk 3: Data Volume Growth
**Impact**: Medium - database size, query performance
**Probability**: High (by design)
**Mitigation**:
- Database indexing on query columns (route, airline, travel_date, scrape_date)
- Pagination on all list endpoints
- Consider partitioning by scrape_date (future)
- Regular database maintenance
- Archive old data after 31 Mar 2026

### Risk 4: Scraping Failures During Critical Periods
**Impact**: Medium - missing data points
**Probability**: Medium
**Mitigation**:
- Retry logic with exponential backoff
- Manual trigger capability
- Alert on consecutive failures
- Partial success handling (some routes OK)
- Document manual recovery procedures

### Risk 5: VPS Resource Constraints
**Impact**: Medium - slow performance, OOM
**Probability**: Low-Medium
**Mitigation**:
- Database-backed queue (not memory-intensive Redis)
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

### Risk 7: Data Integrity Issues
**Impact**: Medium - incorrect analysis
**Probability**: Low
**Mitigation**:
- Validation before persistence
- Deduplication logic
- Append-only data model
- Regular data quality checks
- Keep raw_price_label for verification

---

## Future Enhancements

### Post-MVP Features (After 31 Mar 2026)

#### Analytics Enhancements
- Price forecasting using historical data
- Anomaly detection for unusual price spikes
- Booking recommendation engine
- Seasonal trend analysis
- Airline pricing strategy insights

#### Operational Improvements
- Email/SMS alerts for price drops
- Configurable alert thresholds per route
- Multi-user support with role-based access
- API rate limiting for external access
- Webhook support for integrations

#### Data Extensions
- Seat availability tracking
- Flight duration tracking
- Layover information
- Baggage allowance tracking
- Promo code effectiveness tracking

#### Infrastructure
- Redis for caching and faster queues
- Elasticsearch for advanced search
- Grafana dashboards for monitoring
- Automated backup to S3/cloud storage
- CI/CD pipeline

#### UI/UX
- Mobile-responsive design
- Dark mode
- Customizable dashboards
- Saved filter presets
- Shareable report links
- PDF report generation

### Scalability Considerations (If Expanding)
- Horizontal scaling with load balancer
- Read replicas for database
- Separate scraping workers
- Message queue (RabbitMQ/SQS)
- CDN for frontend assets
- Microservices architecture (if multi-tenant)

---

## Recommendations for Lightweight & Stable System

### Development Practices
1. **Start simple**: Get 1-2 airlines working perfectly before expanding
2. **Test scrapers frequently**: Websites change without notice
3. **Log everything**: Comprehensive logging saves debugging time
4. **Version control scrapers**: Track changes to scraping logic
5. **Document scraper quirks**: Each airline has unique patterns

### Operational Practices
1. **Monitor daily**: Check scrape success rates every morning
2. **Manual backup**: Export data weekly as safety net
3. **Keep it lean**: Don't add features you won't use
4. **Database maintenance**: Regular VACUUM and ANALYZE (PostgreSQL)
5. **Resource monitoring**: Set up basic CPU/memory alerts

### Code Quality
1. **Single responsibility**: One scraper per airline/source
2. **Fail gracefully**: Partial data is better than no data
3. **Idempotency**: Safe to re-run scraping for same date
4. **Clear naming**: Route/airline codes consistent everywhere
5. **Configuration over code**: Externalize scraping parameters

### Deployment
1. **Docker Compose**: Simple, reproducible deployment
2. **Environment variables**: All secrets in .env
3. **Health checks**: Simple endpoint to verify system status
4. **Backup strategy**: Daily database dumps
5. **Rollback plan**: Keep previous Docker images

### Performance
1. **Index wisely**: Only columns used in WHERE/ORDER BY
2. **Lazy loading**: Don't load all data at once
3. **Pagination**: Limit 50-100 records per page
4. **Caching**: Cache route/airline master data
5. **Query optimization**: Use EXPLAIN for slow queries

---

## Final Notes

This plan prioritizes:
- **Correctness**: Historical data integrity is paramount
- **Simplicity**: Avoid over-engineering for single-user system
- **Resilience**: Graceful handling of scraping failures
- **Maintainability**: Clear structure for future updates
- **Pragmatism**: Ship working features incrementally

The system is designed to run reliably on a small VPS until 31 Mar 2026, collecting valuable time-series data for analysis. Focus on getting core scraping stable before adding analytical features.
