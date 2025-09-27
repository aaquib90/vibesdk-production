#!/bin/bash

# Cloudflare deployment script for their build environment
# This script works without .prod.vars file

echo "🚀 Starting Cloudflare deployment..."

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy using wrangler (without env-file since it's not available in Cloudflare's environment)
echo "🚀 Deploying to Cloudflare..."
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo "🌐 Your app should now be live on Cloudflare Workers"
else
    echo "❌ Deployment failed"
    exit 1
fi
