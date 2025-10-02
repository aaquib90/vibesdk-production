#!/bin/bash

# Minimal deployment script that bypasses complex deployment logic
# This script just builds and deploys without containers or complex setup

echo "🚀 Starting minimal deployment..."

# Load environment variables
if [ -f .prod.vars ]; then
    echo "📋 Loading environment variables from .prod.vars"
    export $(grep -v '^#' .prod.vars | grep -v '^$' | xargs)
else
    echo "❌ .prod.vars file not found"
    exit 1
fi

# Check if CLOUDFLARE_API_TOKEN is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN not found in .prod.vars"
    echo "Please uncomment and set CLOUDFLARE_API_TOKEN in .prod.vars"
    exit 1
fi

echo "✅ Environment variables loaded"

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy using wrangler directly
echo "🚀 Deploying to Cloudflare..."
npx wrangler deploy --env-file .prod.vars

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    
    # Purge Cloudflare cache
    echo "🧹 Purging Cloudflare cache..."
    npx tsx scripts/purge-cache.ts all
    
    echo "🌐 Your app should now be live on Cloudflare Workers"
    echo "✨ Cache has been purged - users will see changes immediately!"
else
    echo "❌ Deployment failed"
    exit 1
fi
