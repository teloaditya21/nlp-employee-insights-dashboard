# NLP Employee Insights Dashboard

A comprehensive analytics platform for employee feedback analysis with real-time filtering, sentiment analysis, and AI-powered insights.

## 🌟 Features

### 📊 Dashboard Pages
- **Survey Dashboard**: Real-time word insights with date range filtering
- **Top Insights**: City-based insights with interactive map visualization
- **Smart Analytics**: Employee analytics with comprehensive filtering
- **My Insights**: Personal bookmark management with date filtering
- **Chatbot**: AI-powered chat with RAG system

### 🎯 Core Functionality
- **Date Range Filtering**: Filter insights by date from D1 database
- **Sentiment Analysis**: Positive, negative, and neutral sentiment categorization
- **Real-time Search**: Dynamic text-based filtering
- **Bookmark System**: Save and manage favorite insights
- **AI Conclusions**: Contextual AI-generated summaries
- **Authentication**: Secure login with session management

### 🔧 Technical Features
- **D1 Database Integration**: Serverless SQL database for data persistence
- **Cloudflare Workers API**: Fast edge computing with Hono.js
- **React + TypeScript**: Modern frontend with type safety
- **Responsive Design**: Mobile-first responsive UI
- **Performance Optimized**: Efficient caching and query optimization

## 🚀 Live Demo

- **Frontend**: https://main.employee-insights-frontend.pages.dev
- **API**: https://employee-insights-api.adityalasika.workers.dev

### Login Credentials
- Username: `nlp@admin`
- Password: `12345`

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Dashboard pages
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # API clients and utilities
│   ├── utils/              # Helper functions
│   └── types/              # TypeScript interfaces
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

### Backend (Cloudflare Workers + D1)
```
js-api/
├── src/
│   └── index.js           # Hono.js API routes
├── wrangler.toml          # Cloudflare configuration
└── package.json           # Dependencies
```

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account
- Wrangler CLI

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Backend Setup
```bash
cd js-api
npm install
wrangler dev
```

## 🗄️ Database Schema

### D1 Tables
- `employee_insights`: Core insights data with sentiment analysis
- `bookmarked_insights`: User bookmark management
- `users`: Authentication and session management
- `kota_summary`: City-based analytics summary

## 🚀 Deployment

### Frontend (Cloudflare Pages)
```bash
npm run build
wrangler pages deploy dist --project-name=employee-insights-frontend
```

### Backend (Cloudflare Workers)
```bash
cd js-api
npm run deploy
```

## 📊 API Endpoints

### Core Endpoints
- `GET /api/insights/summary` - Get all word insights
- `GET /api/insights/filtered` - Get filtered insights with date/sentiment/search
- `GET /api/insights/details/:word` - Get detailed insights for specific word
- `GET /api/dashboard/stats` - Get dashboard statistics

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout

### Bookmarks
- `GET /api/bookmarks` - Get user bookmarks
- `POST /api/bookmarks` - Add bookmark
- `DELETE /api/bookmarks/:id` - Remove bookmark

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with NLP brand colors
- **Responsive Layout**: Mobile-first design that works on all devices
- **Interactive Elements**: Smooth animations and hover effects
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Dark Mode Ready**: Prepared for dark theme implementation

## 🔍 Date Range Filtering

The core feature that filters employee insights by date range:

1. **Frontend**: User selects date range in UI
2. **API Call**: `GET /api/insights/filtered?dateFrom=X&dateTo=Y`
3. **Database Query**: Filter `employee_insights` table by date
4. **Word Insights**: Recalculate word insights from filtered data
5. **UI Update**: Real-time updates to cards, statistics, and details

## 🤖 AI Integration

- **Cloudflare AI**: Uses `@cf/meta/llama-4-scout-17b-16e-instruct` model
- **RAG System**: Retrieval-Augmented Generation for contextual responses
- **Dynamic Conclusions**: AI summaries that update with filtered data
- **Chatbot**: Interactive AI assistant for insights exploration

## 📈 Performance

- **Bundle Size**: 1.5MB (428KB gzipped)
- **API Response**: <100ms average response time
- **Database Queries**: Optimized SQL with proper indexing
- **Caching**: React Query for efficient data fetching

## 🛠️ Development

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Component Architecture**: Reusable, composable components
- **Custom Hooks**: Efficient state management
- **Error Handling**: Comprehensive error boundaries

### Testing
```bash
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run lint          # Run linting
npm run type-check    # TypeScript validation
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Cloudflare**: For excellent edge computing platform
- **React Team**: For the amazing frontend framework
- **Hono.js**: For the fast web framework
- **Tailwind CSS**: For the utility-first CSS framework