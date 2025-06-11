# NLP Employee Insights Dashboard - Mobile Version

A mobile-optimized version of the NLP Employee Insights Dashboard, designed specifically for touch interactions and mobile devices.

## Features

### 🔐 Mobile Authentication
- Touch-optimized login interface
- Same credentials as desktop version (`nlp@admin` / `12345`)
- 1-minute session timeout for security
- Responsive design for all mobile screen sizes

### 📊 Mobile Dashboard
- **Word Cloud Visualization**: Interactive word cloud using amCharts5/wc library
- **Top 10 Insights**: Ranked insights with sentiment analysis and importance scores
- **Real-time Data**: Connected to the same backend API as desktop version
- **Offline Support**: Graceful handling of network connectivity issues

### 📱 Mobile-First Design
- Touch-friendly interface with 44px minimum touch targets
- Optimized for portrait orientation
- Safe area support for devices with notches
- Smooth animations and transitions
- Pull-to-refresh functionality

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with mobile-specific utilities
- **Charts**: amCharts5 with word cloud plugin
- **Routing**: Wouter (lightweight router)
- **API**: Axios with interceptors
- **Backend**: Same Hono.js API as desktop version

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Access to the main project dependencies

### Local Development

```bash
# From the project root directory
npm run dev:mobile
```

The mobile app will be available at `http://localhost:5175/`

### Building

```bash
# Build mobile app
npm run build:mobile
```

### Deployment

```bash
# Deploy mobile app to Cloudflare Pages
npm run deploy:mobile

# Or use the deployment script
./deploy-mobile.sh
```

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Mobile-specific components
│   │   ├── MobileWordCloud.tsx
│   │   └── MobileTopInsights.tsx
│   ├── pages/              # Mobile pages
│   │   ├── LoginPage.tsx
│   │   └── DashboardPage.tsx
│   ├── hooks/              # React hooks
│   │   └── useAuth.tsx
│   ├── utils/              # Utilities
│   │   └── api.ts
│   ├── assets/             # Static assets
│   ├── App.tsx             # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Mobile-specific styles
├── index.html             # Mobile HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## API Integration

The mobile app connects to the same production API as the desktop version:
- **Base URL**: `https://employee-insights-api.adityalasika.workers.dev`
- **Word Cloud**: `/api/word-cloud`
- **Top Insights**: `/api/top-insights?limit=10`
- **Authentication**: Bearer token in headers

## Mobile-Specific Features

### Touch Interactions
- Minimum 44px touch targets
- Touch feedback animations
- Swipe gestures support
- Haptic feedback (where supported)

### Performance Optimizations
- Lazy loading of components
- Optimized bundle size
- Efficient re-renders with React.memo
- Image optimization

### Responsive Design
- Fluid typography
- Flexible layouts
- Safe area handling
- Orientation support

## Browser Support

- iOS Safari 14+
- Chrome Mobile 90+
- Firefox Mobile 90+
- Samsung Internet 14+

## Deployment URLs

- **Desktop Version**: Main Cloudflare Pages URL (e.g., `employee-insights-frontend.pages.dev`)
- **Mobile Version**: Separate Cloudflare Pages URL (e.g., `nlp-insights-mobile.pages.dev`)

## Security

- Session timeout (1 minute)
- Secure token storage
- HTTPS enforcement
- Input validation

## Contributing

1. Make changes in the `mobile-app/` directory
2. Test on multiple mobile devices/browsers
3. Ensure responsive design works across screen sizes
4. Update this README if adding new features

## License

MIT License - Same as the main project
