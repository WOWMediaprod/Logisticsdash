-- Enable required extensions for the logistics platform
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for better performance (will be used later)
-- These will be created by Prisma migrations, but keeping for reference
-- CREATE INDEX IF NOT EXISTS idx_gin_fulltext ON rag_chunk USING gin(to_tsvector('english', text));

-- Set up some basic configuration
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Log connections and performance
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
ALTER SYSTEM SET log_duration = 'on';
ALTER SYSTEM SET log_statement = 'mod';

-- Optimize for development
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

SELECT pg_reload_conf();