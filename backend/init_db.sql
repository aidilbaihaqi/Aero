-- SQL Script for creating Aero tables in PostgreSQL

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_users_email ON users(email);


CREATE TABLE scrape_runs (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(50) UNIQUE NOT NULL,
    run_type VARCHAR(10) DEFAULT 'MANUAL',
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scrape_date DATE NOT NULL,
    route VARCHAR(10) NOT NULL,
    status VARCHAR(10) DEFAULT 'RUNNING',
    total_records INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0
);

CREATE INDEX idx_scrape_runs_run_id ON scrape_runs(run_id);
CREATE INDEX idx_scrape_runs_scrape_date ON scrape_runs(scrape_date);


CREATE TABLE flight_fares (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(50) NOT NULL,
    route VARCHAR(10) NOT NULL,
    airline VARCHAR(50) NOT NULL,
    source VARCHAR(30) NOT NULL,
    travel_date DATE NOT NULL,
    flight_number VARCHAR(10) NOT NULL,
    depart_time VARCHAR(5) NOT NULL,
    arrive_time VARCHAR(5) NOT NULL,
    basic_fare NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    scrape_source_page VARCHAR(100),
    source_type VARCHAR(15) NOT NULL,
    raw_price_label VARCHAR(50),
    status_scrape VARCHAR(10) DEFAULT 'SUCCESS',
    error_reason TEXT,
    is_lowest_fare BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_run_id FOREIGN KEY (run_id) REFERENCES scrape_runs(run_id) ON DELETE CASCADE
);

CREATE INDEX idx_flight_fares_route_date ON flight_fares(route, travel_date);
CREATE INDEX idx_flight_fares_run_id ON flight_fares(run_id);
CREATE INDEX idx_flight_fares_airline ON flight_fares(airline);


CREATE TABLE fare_daily_summary (
    id SERIAL PRIMARY KEY,
    route VARCHAR(10) NOT NULL,
    airline VARCHAR(50) NOT NULL,
    travel_date DATE NOT NULL,
    scrape_date DATE NOT NULL,
    daily_min_price NUMERIC(15, 2),
    daily_avg_price NUMERIC(15, 2),
    daily_max_price NUMERIC(15, 2),
    price_change_dod NUMERIC(15, 2),
    volatility DOUBLE PRECISION,
    cheapest_airline_per_day VARCHAR(50),
    cheapest_route_per_day VARCHAR(10)
);

CREATE INDEX idx_fare_summary_route_date ON fare_daily_summary(route, travel_date);
CREATE INDEX idx_fare_summary_scrape_date ON fare_daily_summary(scrape_date);


CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL DEFAULT 'system',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    route VARCHAR(10),
    price_change DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
