-- ==========================================
-- RLS Policies for AppMRR
-- ==========================================
-- 
-- SECURITY STRATEGY:
-- - Public (Publishable key): READ-ONLY access to startups and revenue_metrics
-- - Server (Secret API key): FULL access (bypasses RLS)
-- - api_keys table: NEVER accessible publicly (encrypted data protection)
--
-- This provides defense-in-depth:
-- Even if someone obtains the Publishable key, they cannot:
-- - Read encrypted API keys
-- - Modify any data
-- - Insert fake startups
--
-- Run this in Supabase SQL Editor after creating tables

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STARTUPS TABLE POLICIES
-- ==========================================
-- Allow public read access (for leaderboard display)
CREATE POLICY "Allow public read access to startups"
ON startups
FOR SELECT
USING (true);

-- Block public insert (only server with Secret API key can insert)
CREATE POLICY "Block public insert on startups"
ON startups
FOR INSERT
WITH CHECK (false);

-- Block public update (only server with Secret API key can update)
CREATE POLICY "Block public update on startups"
ON startups
FOR UPDATE
USING (false);

-- Block public delete (only server with Secret API key can delete)
CREATE POLICY "Block public delete on startups"
ON startups
FOR DELETE
USING (false);

-- ==========================================
-- REVENUE_METRICS TABLE POLICIES
-- ==========================================
-- Allow public read access (for leaderboard display)
CREATE POLICY "Allow public read access to revenue_metrics"
ON revenue_metrics
FOR SELECT
USING (true);

-- Block public insert (only server/cron can insert)
CREATE POLICY "Block public insert on revenue_metrics"
ON revenue_metrics
FOR INSERT
WITH CHECK (false);

-- Block public update (only server/cron can update)
CREATE POLICY "Block public update on revenue_metrics"
ON revenue_metrics
FOR UPDATE
USING (false);

-- Block public delete
CREATE POLICY "Block public delete on revenue_metrics"
ON revenue_metrics
FOR DELETE
USING (false);

-- ==========================================
-- API_KEYS TABLE POLICIES (MOST RESTRICTIVE)
-- ==========================================
-- Block ALL public access to encrypted API keys
-- Only server with Secret API key can access (it bypasses RLS)
CREATE POLICY "Block all public access to api_keys"
ON api_keys
FOR ALL
USING (false);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- To verify your policies are working:
--
-- 1. Test with Publishable key (should work):
--    SELECT * FROM startups;
--    SELECT * FROM revenue_metrics;
--
-- 2. Test with Publishable key (should fail):
--    SELECT * FROM api_keys;
--    INSERT INTO startups (name) VALUES ('test');
--    UPDATE revenue_metrics SET mrr = 999 WHERE id = 1;
--
-- 3. Test with Secret API key (should work for everything):
--    All operations should succeed

