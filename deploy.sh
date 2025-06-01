#!/bin/bash

# Deployment script for Sentiment Sphere to Cloudflare
# This script deploys both the API (Workers) and Frontend (Pages)

set -e  # Exit on any error

echo "🚀 Starting deployment to Cloudflare..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
print_status "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_warning "Not logged in to Cloudflare. Please login first:"
    echo "wrangler login"
    exit 1
fi

print_success "Cloudflare authentication verified"

# Step 1: Deploy the API (Workers)
print_status "Deploying API (Cloudflare Workers)..."
cd js-api

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing API dependencies..."
    npm install
fi

# Deploy the worker
print_status "Deploying worker to Cloudflare..."
npm run deploy

if [ $? -eq 0 ]; then
    print_success "API deployed successfully!"
else
    print_error "API deployment failed!"
    exit 1
fi

cd ..

# Step 2: Set up D1 database in production
print_status "Setting up D1 database in production..."
cd js-api

# Run migrations on remote database
print_status "Running database migrations..."
wrangler d1 execute employee-insights --remote --file=migrations/create_users_and_sessions.sql
wrangler d1 execute employee-insights --remote --file=migrations/create_bookmarked_insights.sql
wrangler d1 execute employee-insights --remote --file=migrations/create_kota_summary.sql
wrangler d1 execute employee-insights --remote --file=migrations/create_page_context_summary.sql

print_success "Database migrations completed!"

cd ..

# Step 3: Build and deploy the frontend
print_status "Building frontend application..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Build the application
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed!"
else
    print_error "Frontend build failed!"
    exit 1
fi

# Deploy to Cloudflare Pages
print_status "Deploying frontend to Cloudflare Pages..."
wrangler pages deploy dist --project-name=employee-insights-frontend

if [ $? -eq 0 ]; then
    print_success "Frontend deployed successfully!"
else
    print_error "Frontend deployment failed!"
    exit 1
fi

# Step 4: Display deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "├── API (Workers): https://employee-insights-api.adityalasika.workers.dev"
echo "├── Frontend (Pages): https://employee-insights-frontend.pages.dev"
echo "└── Database: D1 (employee-insights)"
echo ""
echo "🔧 Next steps:"
echo "1. Verify the API is working: curl https://employee-insights-api.adityalasika.workers.dev/health"
echo "2. Test the frontend application"
echo "3. Check logs if needed: wrangler tail"
echo ""
print_success "All services deployed to Cloudflare!"
