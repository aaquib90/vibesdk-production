#!/usr/bin/env node

/**
 * Simplified Cloudflare Deployment Script
 * 
 * This script handles deployment without container dependencies.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

class SimpleDeploymentManager {
	constructor() {
		this.validateEnvironment();
	}

	/**
	 * Validates that all required build variables are present
	 */
	private validateEnvironment(): void {
		const requiredBuildVars = ['CLOUDFLARE_API_TOKEN'];

		const missingVars = requiredBuildVars.filter(
			(varName) => !process.env[varName],
		);

		if (missingVars.length > 0) {
			throw new Error(
				`Missing required build variables: ${missingVars.join(', ')}\n` +
					`Please ensure all required build variables are configured in your deployment.`,
			);
		}
		console.log('✅ Build variables validation passed');
	}

	/**
	 * Cleans Wrangler cache and build artifacts
	 */
	private cleanWranglerCache(): void {
		console.log('🧹 Cleaning Wrangler cache and build artifacts...');

		try {
			// Remove .wrangler directory (contains wrangler cache and state)
			execSync('rm -rf .wrangler', {
				stdio: 'pipe',
				cwd: PROJECT_ROOT,
			});
			console.log('   ✅ Removed .wrangler directory');

			// Remove wrangler.json files from dist/* directories
			try {
				execSync('find dist -name "wrangler.json" -type f -delete 2>/dev/null || true', {
					stdio: 'pipe',
					cwd: PROJECT_ROOT,
				});
				console.log('   ✅ Removed cached wrangler.json files from dist');
			} catch (findError) {
				// Non-critical - continue if find fails
				console.log('   ℹ️  No cached wrangler.json files found in dist');
			}

			console.log('✅ Cache cleanup completed');
		} catch (error) {
			// Non-blocking - log warning but continue
			console.warn(
				`⚠️  Cache cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
			);
			console.warn('   Continuing with deployment...');
		}
	}

	/**
	 * Builds the project
	 */
	private async buildProject(): Promise<void> {
		console.log('🔨 Building project...');

		try {
			// Run build
			execSync('npm run build', {
				stdio: 'inherit',
				cwd: PROJECT_ROOT,
			});

			console.log('✅ Project build completed');
		} catch (error) {
			throw new Error(
				`Failed to build project: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Deploys the project using Wrangler
	 */
	private async wranglerDeploy(): Promise<void> {
		console.log('🚀 Deploying to Cloudflare Workers...');

		try {
			execSync('npx wrangler deploy', {
				stdio: 'inherit',
				cwd: PROJECT_ROOT,
			});

			console.log('✅ Wrangler deployment completed');
		} catch (error) {
			throw new Error(
				`Failed to deploy with Wrangler: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Main deployment orchestration method
	 */
	public async deploy(): Promise<void> {
		console.log('🚀 Simple Cloudflare Deployment Starting...\n');

		const startTime = Date.now();

		try {
			// Step 1: Clean cache
			this.cleanWranglerCache();

			// Step 2: Build project
			console.log('\n📋 Step 1: Building project...');
			await this.buildProject();

			// Step 3: Deploy with Wrangler
			console.log('\n📋 Step 2: Deploying to Cloudflare Workers...');
			await this.wranglerDeploy();

			// Deployment complete
			const duration = Math.round((Date.now() - startTime) / 1000);
			console.log(
				`\n🎉 Deployment finished successfully in ${duration}s!`,
			);
			console.log(
				'✅ Your application is now live! 🚀',
			);
		} catch (error) {
			console.error('\n❌ Deployment failed:');

			if (error instanceof Error) {
				console.error(`   ${error.message}`);
			} else {
				console.error(`   ${error}`);
			}

			console.error('\n🔍 Troubleshooting tips:');
			console.error(
				'   - Verify all environment variables are correctly set',
			);
			console.error(
				'   - Check your Cloudflare API token has required permissions',
			);
			console.error('   - Ensure the build script works locally');

			process.exit(1);
		}
	}
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const deployer = new SimpleDeploymentManager();
	deployer.deploy().catch((error) => {
		console.error('Unexpected error:', error);
		process.exit(1);
	});
}

export default SimpleDeploymentManager;
