-- Create page_context_summary table for storing current page context and filters
-- This table will store summary of the page user is currently viewing
-- Only one record per user session, will be overwritten when user changes page/filters
CREATE TABLE IF NOT EXISTS page_context_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_session_id TEXT NOT NULL DEFAULT 'default_session',
  current_page TEXT NOT NULL CHECK (current_page IN ('survey-dashboard', 'top-insights', 'smart-analytics')),
  active_filters TEXT, -- JSON string containing active filters
  displayed_data TEXT, -- JSON string containing summary of displayed data
  total_insights INTEGER DEFAULT 0,
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  top_keywords TEXT, -- JSON array of top keywords/insights
  date_range TEXT, -- Date range filter if applied
  location_filter TEXT, -- City/Witel filter if applied
  source_filter TEXT, -- Source filter if applied
  ai_conclusion TEXT, -- AI generated conclusion based on current context
  ai_conclusion_generated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_session_id, current_page)
);

-- Create indexes for page_context_summary
CREATE INDEX IF NOT EXISTS idx_page_context_user_session ON page_context_summary(user_session_id);
CREATE INDEX IF NOT EXISTS idx_page_context_current_page ON page_context_summary(current_page);
CREATE INDEX IF NOT EXISTS idx_page_context_updated_at ON page_context_summary(updated_at);

-- Create trigger to update updated_at timestamp for page_context_summary
CREATE TRIGGER IF NOT EXISTS update_page_context_summary_timestamp 
AFTER UPDATE ON page_context_summary
BEGIN
  UPDATE page_context_summary SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert initial sample data for testing
INSERT OR REPLACE INTO page_context_summary (
  user_session_id,
  current_page,
  active_filters,
  displayed_data,
  total_insights,
  positive_count,
  negative_count,
  neutral_count,
  top_keywords,
  date_range,
  location_filter,
  source_filter
) VALUES (
  'default_session',
  'survey-dashboard',
  '{"search": "", "kota": "", "source": "", "dateFrom": "", "dateTo": ""}',
  '{"summary": "Initial dashboard view with all data"}',
  0,
  0,
  0,
  0,
  '[]',
  'All Time',
  'All Cities',
  'All Sources'
);
