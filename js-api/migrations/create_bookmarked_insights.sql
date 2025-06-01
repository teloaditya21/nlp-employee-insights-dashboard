-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT OR IGNORE INTO users (username, password, role) VALUES
('nlp@admin', '12345', 'admin');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- Create bookmarked_insights table
CREATE TABLE IF NOT EXISTS bookmarked_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_id INTEGER NOT NULL,
  insight_title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(insight_id, insight_title)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookmarked_insights_insight_id ON bookmarked_insights(insight_id);
CREATE INDEX IF NOT EXISTS idx_bookmarked_insights_insight_title ON bookmarked_insights(insight_title);
CREATE INDEX IF NOT EXISTS idx_bookmarked_insights_created_at ON bookmarked_insights(created_at);

-- Create employee_insights table
CREATE TABLE IF NOT EXISTS employee_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceData TEXT NOT NULL,
  employeeName TEXT NOT NULL,
  date DATETIME NOT NULL,
  witel TEXT NOT NULL,
  kota TEXT NOT NULL,
  originalInsight TEXT NOT NULL,
  sentenceInsight TEXT NOT NULL,
  wordInsight TEXT NOT NULL,
  sentimen TEXT NOT NULL CHECK (sentimen IN ('positif', 'negatif', 'netral')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for employee_insights table
CREATE INDEX IF NOT EXISTS idx_employee_insights_witel ON employee_insights(witel);
CREATE INDEX IF NOT EXISTS idx_employee_insights_kota ON employee_insights(kota);
CREATE INDEX IF NOT EXISTS idx_employee_insights_sentimen ON employee_insights(sentimen);
CREATE INDEX IF NOT EXISTS idx_employee_insights_wordInsight ON employee_insights(wordInsight);
CREATE INDEX IF NOT EXISTS idx_employee_insights_sourceData ON employee_insights(sourceData);
CREATE INDEX IF NOT EXISTS idx_employee_insights_date ON employee_insights(date);
CREATE INDEX IF NOT EXISTS idx_employee_insights_created_at ON employee_insights(created_at);

-- Insert sample data into employee_insights table
INSERT OR IGNORE INTO employee_insights (sourceData, employeeName, date, witel, kota, originalInsight, sentenceInsight, wordInsight, sentimen, created_at) VALUES
('Survey Online', 'Ahmad Budi', '2024-01-15 10:30:00', 'Jakarta Pusat', 'Jakarta', 'Layanan pelanggan sangat lambat dan tidak responsif', 'Layanan pelanggan lambat', 'layanan pelanggan', 'negatif', '2024-01-15 10:30:00'),
('Media Sosial', 'Siti Nurhaliza', '2024-01-16 14:20:00', 'Bandung', 'Bandung', 'Internet sering putus dan kecepatan tidak stabil', 'Internet tidak stabil', 'internet', 'negatif', '2024-01-16 14:20:00'),
('Email Complaint', 'Rudi Hartono', '2024-01-17 09:15:00', 'Surabaya', 'Surabaya', 'Harga paket cukup terjangkau untuk kualitas yang diberikan', 'Harga paket terjangkau', 'harga paket', 'positif', '2024-01-17 09:15:00'),
('Survey Online', 'Maya Sari', '2024-01-18 16:45:00', 'Medan', 'Medan', 'Kualitas jaringan di daerah saya sangat baik', 'Kualitas jaringan baik', 'kualitas jaringan', 'positif', '2024-01-18 16:45:00'),
('Media Sosial', 'Budi Santoso', '2024-01-19 11:30:00', 'Yogyakarta', 'Yogyakarta', 'Proses instalasi cukup cepat dan teknisi ramah', 'Instalasi cepat teknisi ramah', 'instalasi', 'positif', '2024-01-19 11:30:00'),
('Email Complaint', 'Dewi Lestari', '2024-01-20 13:25:00', 'Semarang', 'Semarang', 'Billing tidak akurat dan sering ada kesalahan', 'Billing tidak akurat', 'billing', 'negatif', '2024-01-20 13:25:00'),
('Survey Online', 'Andi Wijaya', '2024-01-21 08:40:00', 'Makassar', 'Makassar', 'Customer service sangat membantu menyelesaikan masalah', 'Customer service membantu', 'customer service', 'positif', '2024-01-21 08:40:00'),
('Media Sosial', 'Rina Kusuma', '2024-01-22 15:10:00', 'Palembang', 'Palembang', 'Sinyal sering hilang terutama saat hujan', 'Sinyal hilang saat hujan', 'sinyal', 'negatif', '2024-01-22 15:10:00'),
('Email Complaint', 'Joko Susilo', '2024-01-23 12:55:00', 'Denpasar', 'Denpasar', 'Paket data sangat hemat dan sesuai kebutuhan', 'Paket data hemat', 'paket data', 'positif', '2024-01-23 12:55:00'),
('Survey Online', 'Lina Marlina', '2024-01-24 10:20:00', 'Balikpapan', 'Balikpapan', 'Maintenance terlalu sering dan tidak ada pemberitahuan', 'Maintenance sering tanpa pemberitahuan', 'maintenance', 'negatif', '2024-01-24 10:20:00'),
('Media Sosial', 'Hendra Gunawan', '2024-01-25 14:35:00', 'Pontianak', 'Pontianak', 'Aplikasi MyTelkomsel mudah digunakan', 'Aplikasi mudah digunakan', 'aplikasi', 'positif', '2024-01-25 14:35:00'),
('Email Complaint', 'Sri Wahyuni', '2024-01-26 09:50:00', 'Manado', 'Manado', 'Kecepatan upload sangat lambat', 'Kecepatan upload lambat', 'kecepatan upload', 'negatif', '2024-01-26 09:50:00'),
('Survey Online', 'Bambang Prasetyo', '2024-01-27 16:15:00', 'Pekanbaru', 'Pekanbaru', 'Promo yang ditawarkan sangat menarik', 'Promo menarik', 'promo', 'positif', '2024-01-27 16:15:00'),
('Media Sosial', 'Fitri Handayani', '2024-01-28 11:40:00', 'Jambi', 'Jambi', 'Jaringan 4G coverage masih kurang di daerah pinggiran', 'Coverage 4G kurang', 'coverage 4G', 'negatif', '2024-01-28 11:40:00'),
('Email Complaint', 'Agus Setiawan', '2024-01-29 13:05:00', 'Banjarmasin', 'Banjarmasin', 'Teknisi datang tepat waktu dan profesional', 'Teknisi tepat waktu profesional', 'teknisi', 'positif', '2024-01-29 13:05:00'),
('Survey Online', 'Ratna Sari', '2024-01-30 08:25:00', 'Samarinda', 'Samarinda', 'Paket unlimited benar-benar unlimited', 'Paket unlimited sesuai', 'paket unlimited', 'positif', '2024-01-30 08:25:00'),
('Media Sosial', 'Dedi Kurniawan', '2024-01-31 15:50:00', 'Padang', 'Padang', 'Call center sulit dihubungi', 'Call center sulit dihubungi', 'call center', 'negatif', '2024-01-31 15:50:00'),
('Email Complaint', 'Indah Permata', '2024-02-01 12:30:00', 'Batam', 'Batam', 'Kualitas video call sangat jernih', 'Video call jernih', 'video call', 'positif', '2024-02-01 12:30:00'),
('Survey Online', 'Wahyu Hidayat', '2024-02-02 10:45:00', 'Lampung', 'Lampung', 'Tagihan sering terlambat sampai', 'Tagihan terlambat', 'tagihan', 'negatif', '2024-02-02 10:45:00'),
('Media Sosial', 'Sari Dewi', '2024-02-03 14:20:00', 'Cirebon', 'Cirebon', 'Fitur roaming internasional sangat berguna', 'Roaming internasional berguna', 'roaming', 'positif', '2024-02-03 14:20:00');
