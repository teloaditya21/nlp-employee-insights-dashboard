#!/bin/bash

echo "🚀 Starting mobile app deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if mobile-app directory exists
if [ ! -d "mobile-app" ]; then
    echo "❌ Error: mobile-app directory not found."
    exit 1
fi

echo "📱 Building mobile application..."

# Build the mobile app
npm run build:mobile

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Mobile app built successfully!"

# Check if dist-mobile directory was created
if [ ! -d "dist-mobile" ]; then
    echo "❌ Error: dist-mobile directory not found after build."
    exit 1
fi

echo "🌐 Deploying to Cloudflare Pages..."

# Deploy to Cloudflare Pages
npm run deploy:mobile

if [ $? -eq 0 ]; then
    echo "✅ Mobile app deployed successfully!"
    echo "📱 Your mobile app should be available at: https://nlp-insights-mobile.pages.dev"
else
    echo "❌ Deployment failed!"
    exit 1
fi
