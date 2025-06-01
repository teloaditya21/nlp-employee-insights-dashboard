# Deployment Guide - Sentiment Sphere

This guide explains how to deploy the Sentiment Sphere application to Cloudflare.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Authentication**: Login to Cloudflare with `wrangler login`

## Project Structure

```
├── client/                 # React frontend application
├── js-api/                # Cloudflare Workers API (Hono.js)
├── dist/                  # Built frontend files
├── wrangler.toml          # Cloudflare Pages configuration
├── deploy.sh              # Automated deployment script
└── DEPLOYMENT.md          # This file
```

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
./deploy.sh
```

This script will:
1. Deploy the API (Cloudflare Workers)
2. Run database migrations on D1
3. Build and deploy the frontend (Cloudflare Pages)

### Method 2: Manual Deployment

#### Step 1: Deploy the API

```bash
cd js-api
npm install
npm run deploy
```

#### Step 2: Set up Database

```bash
# Run migrations on production D1 database
wrangler d1 execute employee-insights --remote --file=migrations/create_users_and_sessions.sql
wrangler d1 execute employee-insights --remote --file=migrations/create_bookmarked_insights.sql
wrangler d1 execute employee-insights --remote --file=migrations/create_kota_summary.sql
wrangler d1 execute employee-insights --remote --file=migrations/create_page_context_summary.sql
```

#### Step 3: Deploy the Frontend

```bash
cd ..
npm install
npm run build
wrangler pages deploy dist --project-name=sentiment-sphere
```

## Environment Configuration

### Production URLs
- **API**: `https://employee-insights-api.teloaditya21.workers.dev`
- **Frontend**: `https://sentiment-sphere.pages.dev`

### Environment Variables

The application uses these environment variables:

- `VITE_API_BASE_URL`: API endpoint URL
- `ENVIRONMENT`: Deployment environment (production/development)

## Database

The application uses Cloudflare D1 database with these tables:
- `users`: User authentication
- `user_sessions`: Session management
- `bookmarked_insights`: Saved insights
- `kota_summary`: City summary data
- `page_context_summary`: Page context tracking

## Monitoring and Logs

### View Worker Logs
```bash
wrangler tail employee-insights-api
```

### View Pages Deployment Logs
```bash
wrangler pages deployment list --project-name=sentiment-sphere
```

### Check API Health
```bash
curl https://employee-insights-api.teloaditya21.workers.dev/health
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `wrangler login` to authenticate
2. **Build Failures**: Check TypeScript errors with `npm run check`
3. **Database Issues**: Verify D1 database ID in `wrangler.toml`
4. **API Errors**: Check worker logs with `wrangler tail`

### Rollback

To rollback a deployment:

```bash
# For Workers
wrangler rollback employee-insights-api

# For Pages
wrangler pages deployment list --project-name=sentiment-sphere
wrangler pages deployment rollback <deployment-id> --project-name=sentiment-sphere
```

## Custom Domain (Optional)

To use a custom domain:

1. Add domain in Cloudflare Dashboard
2. Update DNS settings
3. Configure custom domain in Pages settings

## CI/CD Integration

For automated deployments, you can integrate with GitHub Actions or other CI/CD platforms using Wrangler CLI in your pipeline.

## Support

For issues related to:
- **Cloudflare Workers**: Check Cloudflare Workers documentation
- **Cloudflare Pages**: Check Cloudflare Pages documentation
- **D1 Database**: Check Cloudflare D1 documentation
