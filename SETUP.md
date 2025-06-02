# Setup Guide for NLP Employee Insights Dashboard

This guide will help you set up the complete NLP Employee Insights Dashboard with all its components.

## 🏗️ Project Structure

```
nlp-employee-insights-dashboard/
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Dashboard pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # API clients and utilities
│   │   └── utils/            # Helper functions
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── js-api/                    # Hono.js API backend
│   ├── src/
│   │   └── index.js          # API routes and logic
│   ├── wrangler.toml         # Cloudflare Workers config
│   └── package.json          # Backend dependencies
├── dist/                      # Built frontend files
├── README.md                  # Project documentation
├── SETUP.md                   # This setup guide
├── DEPLOYMENT.md              # Deployment instructions
├── package.json               # Root package.json
└── vite.config.ts            # Vite configuration
```

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have the following installed:
- **Node.js 18+** (https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- **Cloudflare account** (for deployment)
- **Wrangler CLI**: `npm install -g wrangler`

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/aditlorentz/nlp-employee-insights-dashboard.git
cd nlp-employee-insights-dashboard

# Install root dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Install backend dependencies
cd js-api
npm install
cd ..
```

### 3. Development Setup

#### Frontend Development
```bash
# Start frontend development server
cd client
npm run dev
# Opens at http://localhost:5175
```

#### Backend Development
```bash
# Start backend development server
cd js-api
wrangler dev
# Opens at http://localhost:8787
```

### 4. Environment Configuration

#### Frontend Environment
Create `client/.env.local`:
```env
VITE_API_BASE_URL=https://employee-insights-api.adityalasika.workers.dev
```

#### Backend Environment
The backend uses Cloudflare Workers environment variables configured in `wrangler.toml`.

## 🗄️ Database Setup

### D1 Database Schema

The application uses Cloudflare D1 database with the following tables:

#### 1. employee_insights
```sql
CREATE TABLE employee_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wordInsight TEXT NOT NULL,
  sentenceInsight TEXT NOT NULL,
  originalInsight TEXT NOT NULL,
  employeeName TEXT NOT NULL,
  sourceData TEXT NOT NULL,
  witel TEXT NOT NULL,
  kota TEXT NOT NULL,
  sentimen TEXT NOT NULL,
  date TEXT NOT NULL
);
```

#### 2. bookmarked_insights
```sql
CREATE TABLE bookmarked_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  insight_title TEXT NOT NULL,
  insight_sentiment TEXT NOT NULL,
  bookmarked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### 3. users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. kota_summary
```sql
CREATE TABLE kota_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kota TEXT NOT NULL,
  total_count INTEGER NOT NULL,
  positif_count INTEGER NOT NULL,
  negatif_count INTEGER NOT NULL,
  netral_count INTEGER NOT NULL,
  positif_percentage REAL NOT NULL,
  negatif_percentage REAL NOT NULL,
  netral_percentage REAL NOT NULL
);
```

### Database Initialization

The database is automatically populated with sample data when the API starts.

## 🔧 Configuration Files

### 1. Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5175,
  },
})
```

### 2. Wrangler Configuration (`js-api/wrangler.toml`)
```toml
name = "employee-insights-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "employee-insights-db"
database_id = "your-database-id"
```

### 3. TypeScript Configuration (`client/tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🎯 Key Features Setup

### 1. Authentication System
- Default login: `nlp@admin` / `12345`
- Session timeout: 1 minute for inactive users
- JWT-based authentication with Cloudflare Workers

### 2. Date Range Filtering
- Real-time filtering from D1 database
- API endpoint: `/api/insights/filtered`
- Supports date, sentiment, and search filtering

### 3. Bookmark System
- Save insights to personal collection
- Persistent storage in D1 database
- Real-time bookmark state management

### 4. AI Integration
- Cloudflare AI with Llama model
- RAG system for contextual responses
- Dynamic AI conclusions based on filtered data

## 🧪 Testing

### Frontend Testing
```bash
cd client
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run lint          # ESLint
npm run type-check    # TypeScript validation
```

### API Testing
```bash
# Test API endpoints
curl https://employee-insights-api.adityalasika.workers.dev/api/insights/summary
curl https://employee-insights-api.adityalasika.workers.dev/api/dashboard/stats
```

## 🚀 Deployment

### Production Deployment
```bash
# Build and deploy frontend
npm run build
wrangler pages deploy dist --project-name=employee-insights-frontend

# Deploy backend API
cd js-api
npm run deploy
```

### Live URLs
- **Frontend**: https://main.employee-insights-frontend.pages.dev
- **API**: https://employee-insights-api.adityalasika.workers.dev

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Change port in `vite.config.ts`
2. **API connection**: Check VITE_API_BASE_URL in environment
3. **Database errors**: Verify D1 database configuration
4. **Build errors**: Clear node_modules and reinstall

### Debug Commands
```bash
# Check API health
curl https://employee-insights-api.adityalasika.workers.dev/api/health

# View build output
npm run build --verbose

# Check TypeScript errors
npm run type-check
```

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Hono.js Documentation](https://hono.dev/)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check Cloudflare Workers logs
4. Create an issue in the repository
