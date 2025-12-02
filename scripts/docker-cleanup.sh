#!/bin/bash

echo "🧹 Cleaning up Docker containers and ports..."

# Stop and remove compose containers
echo "Stopping Docker Compose services..."
docker compose down 2>/dev/null || true
cd backend && docker compose down 2>/dev/null || true
cd .. 2>/dev/null || true

# Remove all food-ordering containers
echo "Removing food-ordering containers..."
docker ps -a --filter "name=food-ordering" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

# Kill processes using the ports
echo "Freeing up ports 5672, 27017, 3000-3005, 15672, 5173..."
for port in 5672 27017 3000 3001 3002 3003 3004 3005 15672 5173; do
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -Pi :$port -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    echo "  ✓ Freed port $port"
  fi
done

# Prune unused Docker resources
echo "Pruning unused Docker resources..."
docker system prune -f 2>/dev/null || true

echo "✅ Cleanup complete! You can now run: npm run docker:up"
