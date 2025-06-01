-- Create insight_summary table for storing word-based insights summary
CREATE TABLE IF NOT EXISTS insight_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wordInsight TEXT NOT NULL UNIQUE,
  total_count INTEGER NOT NULL DEFAULT 0,
  positif_count INTEGER NOT NULL DEFAULT 0,
  negatif_count INTEGER NOT NULL DEFAULT 0,
  netral_count INTEGER NOT NULL DEFAULT 0,
  positif_percentage REAL NOT NULL DEFAULT 0.0,
  negatif_percentage REAL NOT NULL DEFAULT 0.0,
  netral_percentage REAL NOT NULL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_insight_summary_word ON insight_summary(wordInsight);
CREATE INDEX IF NOT EXISTS idx_insight_summary_total_count ON insight_summary(total_count);
CREATE INDEX IF NOT EXISTS idx_insight_summary_positif_percentage ON insight_summary(positif_percentage);
CREATE INDEX IF NOT EXISTS idx_insight_summary_negatif_percentage ON insight_summary(negatif_percentage);
CREATE INDEX IF NOT EXISTS idx_insight_summary_created_at ON insight_summary(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_insight_summary_timestamp 
AFTER UPDATE ON insight_summary
BEGIN
  UPDATE insight_summary SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert initial data based on existing employee_insights data
INSERT OR REPLACE INTO insight_summary (
  wordInsight, 
  total_count, 
  positif_count, 
  negatif_count, 
  netral_count,
  positif_percentage,
  negatif_percentage,
  netral_percentage
)
SELECT 
  wordInsight,
  COUNT(*) as total_count,
  SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
  SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
  SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
  ROUND(
    (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
    2
  ) as positif_percentage,
  ROUND(
    (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
    2
  ) as negatif_percentage,
  ROUND(
    (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
    2
  ) as netral_percentage
FROM employee_insights 
WHERE wordInsight IS NOT NULL AND wordInsight != '' 
GROUP BY wordInsight
HAVING COUNT(*) > 0;
