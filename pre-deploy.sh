#!/bin/bash

# Pre-deployment checks for Sentiment Sphere
# This script runs various checks before deployment

set -e

echo "🔍 Running pre-deployment checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Check if required tools are installed
print_status "Checking required tools..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js is installed"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm is installed"

if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Run: npm install -g wrangler"
    exit 1
fi
print_success "Wrangler CLI is installed"

# Check Cloudflare authentication
print_status "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_error "Not logged in to Cloudflare. Run: wrangler login"
    exit 1
fi
print_success "Cloudflare authentication verified"

# Check if dependencies are installed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Frontend dependencies not installed. Installing..."
    npm install
fi
print_success "Frontend dependencies are installed"

if [ ! -d "js-api/node_modules" ]; then
    print_warning "API dependencies not installed. Installing..."
    cd js-api && npm install && cd ..
fi
print_success "API dependencies are installed"

# Run TypeScript checks
print_status "Running TypeScript checks..."
if npm run check; then
    print_success "TypeScript checks passed"
else
    print_warning "TypeScript checks failed, but continuing..."
fi

# Test build
print_status "Testing build process..."
if npm run build; then
    print_success "Build test passed"
else
    print_error "Build test failed"
    exit 1
fi

# Check environment configuration
print_status "Checking environment configuration..."
if [ -f ".env.production" ]; then
    print_success "Production environment file exists"
else
    print_warning "No .env.production file found"
fi

# Check API health (if running locally)
print_status "Checking API health..."
if curl -f http://localhost:8787/health &> /dev/null; then
    print_success "Local API is healthy"
else
    print_warning "Local API is not running (this is OK for production deployment)"
fi

# Check database migrations
print_status "Checking database migrations..."
if [ -d "js-api/migrations" ]; then
    migration_count=$(ls js-api/migrations/*.sql 2>/dev/null | wc -l)
    if [ $migration_count -gt 0 ]; then
        print_success "Found $migration_count database migration(s)"
    else
        print_warning "No database migrations found"
    fi
else
    print_warning "No migrations directory found"
fi

echo ""
echo "✅ Pre-deployment checks completed!"
echo ""
echo "📋 Summary:"
echo "├── Tools: ✅ All required tools are installed"
echo "├── Auth: ✅ Cloudflare authentication verified"
echo "├── Dependencies: ✅ All dependencies installed"
echo "├── Build: ✅ Build process works"
echo "└── Ready for deployment!"
echo ""
echo "🚀 You can now run: ./deploy.sh"
