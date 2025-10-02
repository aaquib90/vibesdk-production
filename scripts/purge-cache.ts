#!/usr/bin/env tsx
/**
 * Cloudflare Cache Purge Utility
 * Purges Cloudflare cache after deployment to ensure users get the latest version
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CloudflareCachePurgeResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: {
    id: string;
  };
}

class CloudflareCachePurger {
  private readonly zoneId = '104352f451411d5c35aa8b5965f75607';
  private readonly apiEndpoint = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/purge_cache`;
  
  constructor() {
    this.loadEnvironmentVariables();
    this.validateEnvironment();
  }

  /**
   * Loads environment variables from .prod.vars if available
   */
  private loadEnvironmentVariables(): void {
    const prodVarsPath = join(process.cwd(), '.prod.vars');
    
    if (existsSync(prodVarsPath)) {
      try {
        const content = readFileSync(prodVarsPath, 'utf-8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            let value = valueParts.join('=');
            
            // Remove inline comments first
            value = value.split('#')[0].trim();
            // Remove quotes
            value = value.replace(/^["'](.*)["']$/, '$1');
            
            // Only set if not already in environment
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
        console.log('📋 Loaded environment variables from .prod.vars');
      } catch (error) {
        console.warn('⚠️  Failed to load .prod.vars:', error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * Validates required environment variables and production environment
   */
  private validateEnvironment(): void {
    // Check if we're in production environment
    const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
    
    if (environment !== 'prod' && environment !== 'production') {
      console.log('ℹ️  Cache purging skipped - not in production environment');
      console.log(`   Current environment: ${environment}`);
      console.log('   💡 Set ENVIRONMENT=prod in .prod.vars to enable cache purging');
      process.exit(0); // Exit gracefully, don't fail deployment
    }

    const requiredVars = ['CLOUDFLARE_API_TOKEN'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables for cache purging:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error('\n💡 Cache purging will be skipped. Set these variables to enable cache purging.');
      process.exit(0); // Exit gracefully, don't fail deployment
    }

    console.log('🔑 Production environment detected - proceeding with cache purging...');
  }

  /**
   * Purges all cache for the zone
   */
  async purgeAllCache(): Promise<void> {
    console.log('🧹 Purging Cloudflare cache...');
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purge_everything: true
        })
      });

      const result: CloudflareCachePurgeResponse = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.errors?.[0]?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Cache purge API response:', JSON.stringify(result, null, 2));
        throw new Error(`Cache purge failed: ${errorMessage}`);
      }

      console.log('✅ Cloudflare cache purged successfully!');
      console.log(`   📋 Purge ID: ${result.result.id}`);
      
    } catch (error) {
      console.error('❌ Cache purge failed:');
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      
      if (error instanceof Error && error.message.includes('Authentication error')) {
        console.error('\n💡 Authentication failed. Your CLOUDFLARE_API_TOKEN may not have zone permissions.');
        console.error('   To enable cache purging:');
        console.error('   1. Go to Cloudflare Dashboard → My Profile → API Tokens');
        console.error('   2. Create a token with "Zone:Cache Purge" permissions');
        console.error('   3. Update CLOUDFLARE_API_TOKEN in .prod.vars');
      } else {
        console.error('\n💡 Deployment succeeded, but cache purging failed.');
      }
      
      console.error('   Users may need to hard refresh to see changes immediately.');
      // Don't fail deployment for cache purge failures
    }
  }

  /**
   * Purges specific URLs (useful for targeted cache invalidation)
   */
  async purgeSpecificUrls(urls: string[]): Promise<void> {
    console.log(`🧹 Purging cache for ${urls.length} specific URLs...`);
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: urls
        })
      });

      const result: CloudflareCachePurgeResponse = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.errors?.[0]?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Specific URLs cache purge API response:', JSON.stringify(result, null, 2));
        throw new Error(`Cache purge failed: ${errorMessage}`);
      }

      console.log('✅ Specific URLs cache purged successfully!');
      console.log(`   📋 Purge ID: ${result.result.id}`);
      console.log(`   🔗 URLs purged: ${urls.length}`);
      
    } catch (error) {
      console.error('❌ Specific URLs cache purge failed:');
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      // Don't fail deployment for cache purge failures
    }
  }

  /**
   * Purges cache for common static assets and API endpoints
   */
  async purgeCommonAssets(): Promise<void> {
    const commonUrls = [
      'https://sportbuilt.me/',
      'https://sportbuilt.me/index.html',
      'https://sportbuilt.me/api/auth/providers',
      'https://sportbuilt.me/assets/index.css',
      'https://sportbuilt.me/assets/index.js',
      'https://sportbuilt.me/favicon.ico',
      'https://sportbuilt.me/logo.svg'
    ];

    await this.purgeSpecificUrls(commonUrls);
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const purger = new CloudflareCachePurger();
  
  // Get purge type from command line arguments
  const purgeType = process.argv[2] || 'all';
  
  switch (purgeType) {
    case 'all':
      await purger.purgeAllCache();
      break;
    case 'common':
      await purger.purgeCommonAssets();
      break;
    case 'urls':
      const urls = process.argv.slice(3);
      if (urls.length === 0) {
        console.error('❌ No URLs provided for purging');
        console.error('Usage: npm run cache:purge urls <url1> <url2> ...');
        process.exit(1);
      }
      await purger.purgeSpecificUrls(urls);
      break;
    default:
      console.error('❌ Invalid purge type. Use: all, common, or urls');
      process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Cache purge script failed:', error);
    process.exit(1);
  });
}

export { CloudflareCachePurger };
