#!/bin/bash

# Git push script with GitHub token
# This script uses the GitHub token from .prod.vars to push changes

# Load environment variables from .prod.vars
if [ -f .prod.vars ]; then
    export $(grep -v '^#' .prod.vars | grep -v '^$' | xargs)
fi

# Check if GITHUB_ACCESS_TOKEN is set
if [ -z "$GITHUB_ACCESS_TOKEN" ]; then
    echo "❌ GITHUB_ACCESS_TOKEN not found in .prod.vars"
    exit 1
fi

# Set the remote URL with the token
git remote set-url origin https://${GITHUB_ACCESS_TOKEN}@github.com/aaquib90/vibesdk-production.git

# Add all changes
git add .

# Commit with a message (use first argument or default)
COMMIT_MSG=${1:-"Update project"}
git commit -m "$COMMIT_MSG"

# Push to main branch
git push origin main

echo "✅ Successfully pushed to GitHub!"
