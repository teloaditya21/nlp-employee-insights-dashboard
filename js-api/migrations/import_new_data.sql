-- Migration script to import new data from database_gabungan.json
-- This script will clear existing data and import the new dataset

-- Clear existing data from employee_insights table
DELETE FROM employee_insights;

-- Clear existing summary tables to regenerate with new data
DELETE FROM insight_summary;
DELETE FROM kota_summary;

-- Reset auto-increment counters
DELETE FROM sqlite_sequence WHERE name IN ('employee_insights', 'insight_summary', 'kota_summary');

-- Note: The actual data import will be done via the API endpoint
-- This script just prepares the database for the new data
