-- Clean database script
-- This will delete all data from all tables

-- Delete all data from tables (in correct order due to foreign keys)
DELETE FROM revenue_metrics;
DELETE FROM api_keys;
DELETE FROM startups;

-- Reset sequences (so new IDs start from 1)
ALTER SEQUENCE startups_id_seq RESTART WITH 1;
ALTER SEQUENCE revenue_metrics_id_seq RESTART WITH 1;
ALTER SEQUENCE api_keys_id_seq RESTART WITH 1;

