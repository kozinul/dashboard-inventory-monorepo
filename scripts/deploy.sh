#!/bin/bash
# ===========================================
# Dashboard Inventory - Deployment Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Dashboard Inventory Deployment...${NC}"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo -e "${YELLOW}Please copy .env.production.example to .env.production and configure it.${NC}"
    exit 1
fi

# Load environment variables
echo -e "${BLUE}📦 Loading environment variables...${NC}"
export $(cat .env.production | grep -v '^#' | xargs)

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed!${NC}"
    exit 1
fi

# Check for Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose is not available!${NC}"
    exit 1
fi

# Pull latest changes from git (if in a git repo)
if [ -d .git ]; then
    echo -e "${BLUE}📥 Pulling latest changes from git...${NC}"
    git pull origin main || git pull origin master || echo "Skipping git pull"
fi

# Build Docker images
echo -e "${BLUE}🔨 Building Docker images...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
echo -e "${YELLOW}🔄 Stopping existing containers...${NC}"
docker compose -f docker-compose.prod.yml down

# Start new containers
echo -e "${GREEN}✨ Starting new containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to become healthy...${NC}"
sleep 10

# Show container status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📊 Container Status:${NC}"
docker compose -f docker-compose.prod.yml ps

# Cleanup old images
echo ""
echo -e "${YELLOW}🧹 Cleaning up unused Docker images...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}🎉 Dashboard Inventory is now running!${NC}"
echo -e "${BLUE}   Frontend: http://localhost${NC}"
echo -e "${BLUE}   Backend:  http://localhost:3000${NC}"
