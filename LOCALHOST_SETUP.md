# 🌐 Localhost Development Setup

## Fixed Port Configuration

The localhost routing issue has been resolved. Here's the correct setup:

### Port Assignments

| Version | Port | URL | Command |
|---------|------|-----|---------|
| **Desktop** | 5173 | `http://localhost:5173/` | `npm run dev` |
| **Mobile** | 5175 | `http://localhost:5175/` | `npm run dev:mobile` |

### What Was Fixed

1. **Port Conflict**: Both desktop and mobile were trying to use conflicting ports
2. **Configuration Mismatch**: Multiple vite config files had inconsistent port settings
3. **Documentation**: Updated all documentation to reflect correct ports

### Changes Made

#### 1. Updated `vite.mobile.config.js`
```javascript
server: {
  port: 5175,  // Changed from 5174
  host: true,
  open: true
}
```

#### 2. Updated `mobile-app/vite.config.ts`
```javascript
server: {
  port: 5175,  // Changed from 5174
  host: true
}
```

#### 3. Updated Documentation
- `MOBILE_SETUP.md` - Updated port references
- `mobile-app/README.md` - Updated port references

## How to Start Development Servers

### Option 1: Start Both Servers
```bash
# Terminal 1 - Desktop version
npm run dev

# Terminal 2 - Mobile version  
npm run dev:mobile
```

### Option 2: Start Individual Servers
```bash
# Desktop only (port 5173)
npm run dev

# Mobile only (port 5175)
npm run dev:mobile
```

## Verification

Both servers are now running correctly:

- ✅ **Desktop**: http://localhost:5173/ - Shows desktop interface
- ✅ **Mobile**: http://localhost:5175/ - Shows mobile interface

## Network Access

For testing on mobile devices, use the network IP:

```bash
# Desktop
http://192.168.1.x:5173/

# Mobile  
http://192.168.1.x:5175/
```

## Troubleshooting

### If ports are still conflicting:

1. **Kill existing processes**:
   ```bash
   # Kill processes on specific ports
   lsof -ti:5173 | xargs kill -9
   lsof -ti:5175 | xargs kill -9
   ```

2. **Clear cache and restart**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev:mobile
   ```

3. **Check port availability**:
   ```bash
   lsof -i :5173
   lsof -i :5175
   ```

### If mobile app shows desktop interface:

1. Ensure you're accessing the correct URL: `http://localhost:5175/`
2. Clear browser cache
3. Check that `npm run dev:mobile` is running successfully

## Project Structure

```
├── client/                 # Desktop app (port 5173)
│   ├── src/
│   └── vite.config.js     # Desktop Vite config
├── mobile-app/            # Mobile app (port 5175)
│   ├── src/
│   └── vite.config.ts     # Mobile Vite config
└── vite.mobile.config.js  # Root mobile Vite config
```

## Next Steps

1. **Development**: Use the correct URLs for each version
2. **Testing**: Test both versions independently
3. **Deployment**: Each version deploys to separate Cloudflare Workers
   - Desktop: `employee-insights-frontend.pages.dev`
   - Mobile: `nlp-insights-mobile.pages.dev`

---

**Note**: The mobile version is completely separate from the desktop version, with its own components, styling, and user experience optimized for mobile devices.
