#!/bin/bash
echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart APP
pm2 restart nextjs-app

echo "Deployment completed!"
