-- Database schema for RevenueCat MRR Leaderboard

-- Startups table
CREATE TABLE IF NOT EXISTS startups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website_url VARCHAR(500),
    founder_username VARCHAR(100),
    app_store_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue metrics table
CREATE TABLE IF NOT EXISTS revenue_metrics (
    id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    mrr DECIMAL(12, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(startup_id)
);

-- API keys table (encrypted)
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    revenuecat_api_key TEXT NOT NULL, -- Encrypted
    revenuecat_project_id VARCHAR(255), -- Optional project ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(startup_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_revenue_metrics_startup_id ON revenue_metrics(startup_id);
CREATE INDEX IF NOT EXISTS idx_revenue_metrics_total_revenue ON revenue_metrics(total_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_metrics_mrr ON revenue_metrics(mrr DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_startup_id ON api_keys(startup_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_project_id_unique
    ON api_keys(revenuecat_project_id)
    WHERE revenuecat_project_id IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON startups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

