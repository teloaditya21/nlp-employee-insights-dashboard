# Employee Insights API 🚀

API cepat untuk analisis sentimen feedback karyawan menggunakan **Hono.js** dan **Cloudflare Workers**.

## ✨ Fitur Utama

- 🔥 **Super Cepat** - Dibangun dengan Hono.js framework edge-first
- 🌍 **Global CDN** - Deploy di Cloudflare Workers untuk latensi rendah
- 📊 **Database Real-time** - Cloudflare D1 SQLite untuk performa tinggi
- 🔍 **Search & Filter** - Pencarian insights berdasarkan kata kunci
- 📈 **Dashboard Analytics** - Statistik lengkap sentiment analysis
- 🛡️ **CORS Enabled** - Akses dari frontend aplikasi

## 🔗 Base URL

```
https://employee-insights-api.adityalasika.workers.dev
```

## 📋 API Endpoints

### 1. Root Endpoint
```http
GET /
```
Menampilkan informasi API dan daftar endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Employee Insights API v1.0 - Powered by Hono.js & Cloudflare Workers",
  "version": "1.0.0",
  "endpoints": {
    "GET /api/insights/summary": "Get all insights summary",
    "GET /api/insights/dashboard": "Get dashboard statistics",
    "GET /api/insights/top-positive": "Get top positive insights",
    "GET /api/insights/top-negative": "Get top negative insights",
    "GET /api/insights/search/:word": "Search insights by word"
  }
}
```

### 2. Dashboard Statistics
```http
GET /api/insights/dashboard
```
Mendapatkan statistik lengkap dashboard untuk analisis sentimen.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_insights": 101,
    "total_feedback": 641,
    "positive_ratio": 48.99,
    "negative_ratio": 46.33,
    "neutral_ratio": 4.68,
    "sentiment_distribution": {
      "positive": 314,
      "negative": 297,
      "neutral": 30
    },
    "top_positive_insights": [...],
    "top_negative_insights": [...],
    "all_insights": [...]
  }
}
```

### 3. All Insights Summary
```http
GET /api/insights/summary
```
Mendapatkan semua insights summary terurut berdasarkan total count.

### 4. Top Positive Insights
```http
GET /api/insights/top-positive
```
Mendapatkan insights dengan sentiment positif tertinggi (>70%).

### 5. Top Negative Insights
```http
GET /api/insights/top-negative
```
Mendapatkan insights dengan sentiment negatif tertinggi (>70%).

### 6. Search Insights
```http
GET /api/insights/search/:word
```
Mencari insights berdasarkan kata kunci.

**Example:**
```bash
curl https://employee-insights-api.adityalasika.workers.dev/api/insights/search/wellness
```

### 7. Paginated Insights
```http
GET /api/insights/paginated?page=1&limit=10
```
Mendapatkan insights dengan pagination.

**Query Parameters:**
- `page` (optional) - Nomor halaman (default: 1)
- `limit` (optional) - Jumlah item per halaman (default: 10)

### 8. Health Check
```http
GET /health
```
Cek status kesehatan API.

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Wrangler CLI
- Cloudflare Account

### Installation
```bash
npm install
```

### Local Development
```bash
npm run dev
```

### Deployment
```bash
npm run deploy
```

## 📊 Data Schema

### Insight Summary
```json
{
  "id": 75,
  "word_insight": "Program Wellness",
  "total_count": 42,
  "positif_count": 32,
  "negatif_count": 7,
  "netral_count": 3,
  "positif_percentage": 76.19,
  "negatif_percentage": 16.67,
  "netral_percentage": 7.14,
  "created_at": "2025-05-24 22:01:18"
}
```

## 🔍 Example Usage

### JavaScript/TypeScript
```javascript
// Fetch dashboard data
const response = await fetch('https://employee-insights-api.adityalasika.workers.dev/api/insights/dashboard');
const data = await response.json();

if (data.success) {
  console.log('Total Insights:', data.data.total_insights);
  console.log('Positive Ratio:', data.data.positive_ratio + '%');
}
```

### Python
```python
import requests

# Search for specific insights
response = requests.get('https://employee-insights-api.adityalasika.workers.dev/api/insights/search/wellness')
data = response.json()

if data['success']:
    for insight in data['data']:
        print(f"{insight['word_insight']}: {insight['positif_percentage']}% positive")
```

### cURL
```bash
# Get top negative insights
curl -X GET https://employee-insights-api.adityalasika.workers.dev/api/insights/top-negative \
  -H "Content-Type: application/json" | json_pp
```

## 📈 Performance

- **Cold Start:** < 1ms
- **Response Time:** < 50ms
- **Throughput:** 1000+ RPS
- **Global CDN:** 270+ locations worldwide

## 🔐 Security

- CORS enabled untuk akses frontend
- Rate limiting otomatis dari Cloudflare
- Edge security protection
- Environment variables untuk sensitive data

## 🎯 Key Insights

Berdasarkan data analysis terbaru:

### ✅ **Top Positive Areas:**
1. **Pengembangan Kompetensi** - 100% positive
2. **Bantuan Pendidikan** - 100% positive  
3. **Program CSR** - 100% positive
4. **Rotasi Karyawan** - 81.48% positive
5. **Employee Recognition** - 78.05% positive

### ❌ **Areas Need Attention:**
1. **Fasilitas Kantor** - 100% negative
2. **Kebijakan Perusahaan** - 100% negative
3. **Proses Onboarding** - 100% negative
4. **Klaim Asuransi** - 93.75% negative
5. **Sistem Promosi** - 90% negative

## 🚀 Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono.js 3.12.8
- **Database:** Cloudflare D1 SQLite
- **Language:** JavaScript ES6+
- **CDN:** Global edge network

## 📞 Support

Untuk pertanyaan atau dukungan teknis, hubungi tim SentimentSphere.

---

**© 2024 SentimentSphere Team - Powered by Hono.js & Cloudflare Workers** 