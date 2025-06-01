# SentimentSphere Frontend

Frontend dari aplikasi SentimentSphere. Proyek ini adalah versi frontend-only dari proyek asli yang dapat ditemukan di [github.com/aditlorentz/SentimentSphere](https://github.com/aditlorentz/SentimentSphere).

## Tentang Aplikasi

SentimentSphere adalah aplikasi analisis sentimen dan insight yang memungkinkan pengguna untuk:
- Melihat dashboard survei
- Menganalisis insight personal
- Melihat top insights
- Menggunakan analitik cerdas
- Dan banyak lagi

## Menjalankan Aplikasi

### Prasyarat
- Node.js (versi 16+)
- npm atau yarn

### Langkah Instalasi

1. Install dependensi
```
npm install
# atau jika menggunakan yarn
yarn install
```

2. Jalankan aplikasi dalam mode development
```
npm run dev
# atau
yarn dev
```

3. Build untuk produksi
```
npm run build
# atau
yarn build
```

4. Jalankan server frontend setelah build
```
npm start
# atau
yarn start
```

## Login Dummy
Username: admin@nlp
Password: 12345

## 🚀 Deployment ke Cloudflare

### Prasyarat Deployment
- Node.js 18+ terinstall
- Akun Cloudflare
- Wrangler CLI: `npm install -g wrangler`
- Login ke Cloudflare: `wrangler login`

### Deployment Otomatis (Recommended)
```bash
# Jalankan pengecekan pre-deployment
./pre-deploy.sh

# Deploy semua ke Cloudflare
./deploy.sh
```

### Deployment Manual
```bash
# 1. Deploy API (Workers)
cd js-api && npm run deploy

# 2. Deploy Frontend (Pages)
npm run build && wrangler pages deploy dist --project-name=employee-insights-frontend
```

### URL Live
- **Frontend**: https://employee-insights-frontend.pages.dev
- **API**: https://employee-insights-api.adityalasika.workers.dev

## Catatan

Aplikasi ini sudah terintegrasi dengan backend Cloudflare Workers dan database D1. Semua fitur sudah berfungsi penuh setelah deployment.