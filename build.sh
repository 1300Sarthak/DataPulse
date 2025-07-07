#!/bin/bash

# DataPulse Build Script for Render Deployment

echo "🚀 Building DataPulse for production..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t datapulse .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "To test locally:"
    echo "docker run -p 8000:80 datapulse"
    echo ""
    echo "To deploy to Render:"
    echo "1. Push your code to GitHub"
    echo "2. Connect your repository to Render"
    echo "3. Set environment variables in Render dashboard"
    echo "4. Deploy!"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Build failed!"
    exit 1
fi 