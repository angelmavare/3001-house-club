#!/bin/bash

# Netlify Deployment Script for 3001 Club House
# This script helps automate the deployment process

echo "🚀 3001 Club House - Netlify Deployment Script"
echo "================================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your NOTION_API_KEY"
    echo "Example:"
    echo "NOTION_API_KEY=your_api_key_here"
    echo "PORT=3000"
    exit 1
fi

# Check if NOTION_API_KEY is set
if ! grep -q "NOTION_API_KEY" .env; then
    echo "❌ NOTION_API_KEY not found in .env file"
    exit 1
fi

echo "✅ Environment file found"

# Test local setup
echo "🧪 Testing local setup..."
npm run test

if [ $? -ne 0 ]; then
    echo "❌ Local test failed. Please fix issues before deploying."
    exit 1
fi

echo "✅ Local test passed"

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
else
    echo "✅ Netlify CLI already installed"
fi

# Check if user is logged in to Netlify
echo "🔐 Checking Netlify authentication..."
if ! netlify status &> /dev/null; then
    echo "❌ Not logged in to Netlify"
    echo "Please run: netlify login"
    exit 1
fi

echo "✅ Logged in to Netlify"

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "Next steps:"
    echo "1. Set NOTION_API_KEY in your Netlify environment variables"
    echo "2. Trigger a new deploy to apply environment variables"
    echo "3. Test your API endpoints"
else
    echo "❌ Deployment failed"
    exit 1
fi 