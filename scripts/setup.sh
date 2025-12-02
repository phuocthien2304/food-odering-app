#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Food Ordering App - Setup${NC}"
echo -e "${BLUE}================================${NC}"

# Check prerequisites
echo -e "\n${BLUE}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js is installed: $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm is installed: $(npm --version)${NC}"

# Organize backend
echo -e "\n${BLUE}Organizing backend services...${NC}"

if [ ! -d "backend" ]; then
    mkdir -p backend
    echo -e "${GREEN}✓ Created backend directory${NC}"
fi

# Move services to backend if they exist in root
for service in api-gateway user-service order-service restaurant-service delivery-service payment-service; do
    if [ -d "$service" ] && [ ! -d "backend/$service" ]; then
        mv "$service" "backend/"
        echo -e "${GREEN}✓ Moved $service to backend${NC}"
    fi
done

# Install frontend dependencies
echo -e "\n${BLUE}Installing frontend dependencies...${NC}"
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ..

# Build Docker images
echo -e "\n${BLUE}Building Docker images...${NC}"
docker-compose build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Docker images${NC}"
    exit 1
fi

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Start backend: ${BLUE}npm run docker:up${NC}"
echo -e "2. In another terminal, start frontend: ${BLUE}cd frontend && npm run dev${NC}"
echo -e "3. Open http://localhost:5173 in your browser"

echo -e "\n${BLUE}Useful commands:${NC}"
echo -e "View logs: ${BLUE}npm run docker:logs${NC}"
echo -e "Stop services: ${BLUE}docker-compose down${NC}"
echo -e "Clean up: ${BLUE}npm run docker:clean${NC}"
