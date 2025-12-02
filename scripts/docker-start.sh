#!/bin/bash

set -e

echo "🚀 Starting Food Ordering Microservices..."

# Check if backend directory exists
if [ ! -d "backend" ]; then
  echo "❌ Error: backend directory not found"
  echo "Please run: npm run migrate"
  exit 1
fi

# Check if services exist in backend
REQUIRED_SERVICES=("api-gateway" "user-service" "order-service" "restaurant-service" "delivery-service" "payment-service")
MISSING=false

for service in "${REQUIRED_SERVICES[@]}"; do
  if [ ! -d "backend/$service" ]; then
    echo "❌ Missing: backend/$service"
    MISSING=true
  fi
done

if [ "$MISSING" = true ]; then
  echo "❌ Some services are missing in backend/"
  echo "Please run: npm run migrate"
  exit 1
fi

echo "✓ All services found"
echo ""
echo "Starting services from: $(pwd)"

# Start backend services
cd backend
echo "Starting backend services..."
docker compose up -d

cd ..

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📊 Service URLs:"
echo "  • API Gateway:       http://localhost:3000"
echo "  • User Service:      http://localhost:3003"
echo "  • Order Service:     http://localhost:3001"
echo "  • Restaurant Service: http://localhost:3002"
echo "  • Delivery Service:   http://localhost:3004"
echo "  • Payment Service:    http://localhost:3005"
echo "  • RabbitMQ Console:  http://localhost:15672 (guest/guest)"
echo "  • MongoDB:           mongodb://localhost:27017"
echo "  • Frontend:          http://localhost:5173 (run: npm run frontend:dev)"
echo ""
echo "Monitor logs: npm run docker:logs"
