-- Create kota_summary table for storing city-based insights summary
CREATE TABLE IF NOT EXISTS kota_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kota TEXT NOT NULL UNIQUE,
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kota_summary_kota ON kota_summary(kota);
CREATE INDEX IF NOT EXISTS idx_kota_summary_total_count ON kota_summary(total_count);
CREATE INDEX IF NOT EXISTS idx_kota_summary_created_at ON kota_summary(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_kota_summary_timestamp 
AFTER UPDATE ON kota_summary
BEGIN
  UPDATE kota_summary SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert initial data based on existing employee_insights data
INSERT OR REPLACE INTO kota_summary (
  kota, 
  total_count, 
  positif_count, 
  negatif_count, 
  netral_count,
  positif_percentage,
  negatif_percentage,
  netral_percentage
)
SELECT 
  kota,
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
WHERE kota IS NOT NULL AND kota != '' 
GROUP BY kota
HAVING COUNT(*) > 0;
