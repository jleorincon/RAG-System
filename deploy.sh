#!/bin/bash

# RAG System Deployment Script
# Phase 5: Production Deployment

set -e

echo "🚀 RAG System Deployment Script"
echo "================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Check if environment file exists
if [ ! -f "apps/web/.env.local" ]; then
    echo "⚠️  Environment file not found. Please create apps/web/.env.local"
    echo "   You can copy from env.example and fill in your values:"
    echo "   cp env.example apps/web/.env.local"
    echo ""
    echo "   Required variables:"
    echo "   - OPENAI_API_KEY"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the application
echo "🔨 Building application..."
cd apps/web
pnpm build

echo "✅ Build completed successfully"

# Check if we should deploy to Vercel
read -p "🌐 Deploy to Vercel? (y/n): " deploy_vercel

if [ "$deploy_vercel" = "y" ] || [ "$deploy_vercel" = "Y" ]; then
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "📥 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Deployment to Vercel completed!"
    echo "🌍 Your RAG system should now be live!"
else
    echo "🏠 Starting local production server..."
    echo "📍 Server will be available at: http://localhost:3000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    pnpm start
fi

echo ""
echo "🎉 Phase 5 Deployment Complete!"
echo "================================="
echo "Your RAG system is now ready with:"
echo "✅ Document upload and processing"
echo "✅ AI-powered chat interface"  
echo "✅ Vector similarity search"
echo "✅ Structured data querying"
echo "✅ MCP tools integration"
echo "✅ Phase 5 testing interface"
echo ""
echo "📖 For troubleshooting, see PHASE_5_DEPLOYMENT_GUIDE.md" 