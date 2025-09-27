# Security Guide for VibeSDK Production

## 🔐 Environment Variables Security

### ✅ DO:
- Use `wrangler login` for authentication (recommended)
- Set sensitive values via Cloudflare Dashboard
- Use environment variables for local development
- Keep `.prod.vars` and `.dev.vars` files secure

### ❌ NEVER:
- Commit API tokens to version control
- Share API tokens in chat/email
- Use production tokens in development
- Store secrets in plain text files

## 🚀 Deployment Options

### Option 1: OAuth Authentication (Recommended)
```bash
npx wrangler login
npx wrangler deploy
```

### Option 2: Environment Variables
```bash
export CLOUDFLARE_API_TOKEN="your-token"
npx wrangler deploy
```

### Option 3: Cloudflare Dashboard
- Set secrets via Cloudflare Dashboard
- Use `wrangler deploy` without API token

## 🔧 Required Permissions

Your Cloudflare API token needs:
- Account:Read
- Workers:Edit
- Zone:Read (for custom domains)
- R2:Edit
- D1:Edit
- KV:Edit
- Durable Objects:Edit
- Workers for Platforms:Edit
- AI Gateway:Edit

## 📝 Current Configuration Status

✅ Preview domain configured: `vibesdk-production.workers.dev`
✅ Preview URLs enabled
✅ Security practices implemented
⚠️ Docker required for full deployment
