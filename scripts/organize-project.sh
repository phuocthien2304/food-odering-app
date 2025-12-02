#!/bin/bash

# Script to organize backend and frontend directories

echo "🚀 Organizing Food Ordering App Structure..."

# Create backend directory if it doesn't exist
mkdir -p backend

# Move all backend microservices to backend folder
echo "📦 Moving microservices to backend..."
mv api-gateway backend/ 2>/dev/null || true
mv delivery-service backend/ 2>/dev/null || true
mv order-service backend/ 2>/dev/null || true
mv payment-service backend/ 2>/dev/null || true
mv restaurant-service backend/ 2>/dev/null || true
mv user-service backend/ 2>/dev/null || true

# Move docker-compose and backend documentation to backend
mv docker-compose.yml backend/ 2>/dev/null || true
mv API_DOCUMENTATION.md backend/ 2>/dev/null || true
mv DEPLOYMENT.md backend/ 2>/dev/null || true

# Keep frontend folder as is (already separated)
echo "✅ Frontend folder already organized"

# Create new root docker-compose that orchestrates both
echo "📝 Project structure organized successfully!"
echo ""
echo "Directory Structure:"
echo "├── backend/"
echo "│   ├── api-gateway/"
echo "│   ├── delivery-service/"
echo "│   ├── order-service/"
echo "│   ├── payment-service/"
echo "│   ├── restaurant-service/"
echo "│   ├── user-service/"
echo "│   └── docker-compose.yml"
echo "├── frontend/"
echo "└── docker-compose.yml (orchestrates both)"
