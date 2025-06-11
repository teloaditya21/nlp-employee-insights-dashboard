# NLP Employee Insights Dashboard - Mobile Version Setup

This document provides comprehensive setup and deployment instructions for the mobile version of the NLP Employee Insights Dashboard.

## 🏗️ Project Structure

The mobile version is completely separate from the desktop version:

```
├── mobile-app/                 # Mobile application directory
│   ├── src/
│   │   ├── components/         # Mobile-specific components
│   │   ├── pages/             # Mobile pages (Login, Dashboard)
│   │   ├── hooks/             # React hooks (useAuth)
│   │   ├── utils/             # API utilities
│   │   └── assets/            # Mobile assets
│   ├── index.html             # Mobile HTML template
│   ├── vite.config.ts         # Mobile Vite config
│   └── tailwind.config.js     # Mobile Tailwind config
├── vite.mobile.config.js      # Root mobile Vite config
└── deploy-mobile.sh           # Mobile deployment script
```

## 🚀 Quick Start

### 1. Development Server

```bash
# Start mobile development server
npm run dev:mobile

# Access at: http://localhost:5174/
```

### 2. Build Mobile App

```bash
# Build mobile version
npm run build:mobile

# Output: dist-mobile/ directory
```

### 3. Deploy Mobile App

```bash
# Deploy to Cloudflare Pages
npm run deploy:mobile

# Or use the deployment script
./deploy-mobile.sh
```

## 📱 Mobile Features

### Authentication
- **Username**: `nlp@admin`
- **Password**: `12345`
- **Session Timeout**: 1 minute
- **Storage**: localStorage with prefix `mobile_`

### Dashboard Layout
1. **Header**: Logo, online status, refresh, logout
2. **Word Cloud**: Interactive visualization using amCharts5/wc
3. **Top 10 Insights**: Ranked by importance with sentiment analysis
4. **Footer**: Offline indicator when disconnected

### Mobile Optimizations
- Touch-friendly 44px minimum targets
- Safe area support for notched devices
- Responsive typography and spacing
- Smooth animations and transitions
- Pull-to-refresh functionality
- Offline state handling

## 🔧 Technical Configuration

### Vite Configuration

The mobile app uses a separate Vite configuration:

```javascript
// vite.mobile.config.js
export default defineConfig({
  plugins: [react()],
  root: './mobile-app',
  build: {
    outDir: '../dist-mobile',
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    host: true
  },
  base: '/mobile/'
})
```

### API Integration

The mobile app connects to the same backend API:

- **Base URL**: `https://employee-insights-api.adityalasika.workers.dev`
- **Endpoints**:
  - `/api/word-cloud` - Word cloud data
  - `/api/top-insights?limit=10` - Top insights
  - `/api/survey-data` - Survey data

### Routing Structure

- **Base Path**: `/` (separate domain/subdomain)
- **Routes**:
  - `/` - Dashboard (authenticated) or Login
  - `/login` - Login page
  - `/dashboard` - Dashboard page

## 🎨 Styling & Design

### Tailwind Configuration

Mobile-specific Tailwind utilities:

```css
.mobile-container { /* Full-screen container */ }
.mobile-card { /* Card component */ }
.mobile-button { /* Touch-optimized button */ }
.mobile-input { /* Form input */ }
.mobile-header { /* Sticky header */ }
.mobile-content { /* Scrollable content */ }
.touch-target { /* 44px minimum touch target */ }
```

### Color Scheme

Consistent with desktop version:
- **Primary**: Blue (#3B82F6)
- **Secondary**: Teal (#06B6D4)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

## 📊 Components

### MobileWordCloud
- Uses amCharts5/wc library
- Touch-optimized interactions
- Responsive sizing
- Loading states

### MobileTopInsights
- Displays top 10 insights
- Sentiment color coding
- Importance scoring
- Touch-friendly cards

### Authentication
- Mobile-optimized login form
- Session management
- Auto-logout on timeout
- Secure token storage

## 🌐 Deployment

### Cloudflare Pages Setup

1. **Project Configuration**:
   ```bash
   # Build command
   npm run build:mobile
   
   # Build output directory
   dist-mobile
   
   # Root directory
   /
   ```

2. **Environment Variables**:
   - No additional environment variables needed
   - Uses same API as desktop version

3. **Custom Domain** (Optional):
   - Set up custom domain in Cloudflare Pages
   - Mobile app will be accessible at `yourdomain.com/mobile/`

### Deployment Script

The `deploy-mobile.sh` script automates the deployment process:

```bash
#!/bin/bash
echo "🚀 Starting mobile app deployment..."
npm run build:mobile
npm run deploy:mobile
echo "✅ Mobile app deployed successfully!"
```

## 🔍 Testing

### Local Testing

1. **Desktop Browser**:
   ```bash
   npm run dev:mobile
   # Open http://localhost:5175/
   # Use browser dev tools mobile simulation
   ```

2. **Mobile Device**:
   ```bash
   npm run dev:mobile
   # Access via network IP: http://192.168.1.x:5175/
   ```

### Browser Support

- **iOS Safari**: 14+
- **Chrome Mobile**: 90+
- **Firefox Mobile**: 90+
- **Samsung Internet**: 14+

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**:
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build:mobile
   ```

2. **API Connection Issues**:
   - Check network connectivity
   - Verify API endpoint is accessible
   - Check browser console for CORS errors

3. **Touch Interactions Not Working**:
   - Ensure minimum 44px touch targets
   - Check for CSS pointer-events: none
   - Verify touch-action CSS properties

### Debug Mode

Enable debug logging:

```javascript
// In mobile-app/src/utils/api.ts
const DEBUG = true;

if (DEBUG) {
  console.log('API Request:', config);
}
```

## 📈 Performance

### Optimization Strategies

1. **Bundle Size**:
   - Tree shaking enabled
   - Dynamic imports for large components
   - Optimized amCharts5 imports

2. **Runtime Performance**:
   - React.memo for expensive components
   - useMemo for computed values
   - useCallback for event handlers

3. **Network**:
   - API request caching
   - Offline state handling
   - Progressive loading

### Monitoring

Monitor mobile performance:
- Bundle analyzer: `npm run build:mobile -- --analyze`
- Lighthouse mobile audit
- Real device testing

## 🔒 Security

### Authentication Security
- Session timeout (1 minute)
- Secure token storage
- HTTPS enforcement
- Input validation

### Data Protection
- No sensitive data in localStorage
- API token rotation
- Secure API communication

## 📝 Contributing

### Development Workflow

1. Make changes in `mobile-app/` directory
2. Test on multiple devices/screen sizes
3. Ensure responsive design works
4. Update documentation if needed
5. Test deployment process

### Code Standards

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1)

## 📞 Support

For issues specific to the mobile version:
1. Check this documentation
2. Review browser console errors
3. Test on multiple devices
4. Check API connectivity
5. Verify deployment configuration
