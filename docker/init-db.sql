-- Initialize database for Real Estate Aggregator
-- This script runs when the PostgreSQL container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create indexes for better performance
-- These will be created after tables are synced by Sequelize

-- Set default configuration
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Create a read-only user for analytics/reporting
CREATE USER readonly_user WITH PASSWORD 'readonly123';
GRANT CONNECT ON DATABASE real_estate_aggregator TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;

-- Grant select permissions on all tables (will need to be run after tables are created)
-- This is handled by the application startup process