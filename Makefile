# Makefile for Upivot Interview Drills App

.PHONY: help up down build logs clean seed reset test lint

# Default target
help:
	@echo "Upivot Interview Drills - Available Commands:"
	@echo ""
	@echo "  make up      - Start all services with docker-compose"
	@echo "  make down    - Stop all services"
	@echo "  make build   - Build all containers from scratch"
	@echo "  make logs    - View logs from all services"
	@echo "  make clean   - Stop services and remove volumes"
	@echo "  make seed    - Seed database with sample data"
	@echo "  make reset   - Reset database (clear all data)"
	@echo "  make test    - Run k6 performance tests"
	@echo "  make lint    - Run linting on both web and api"
	@echo ""

# Start all services
up:
	@echo "🚀 Starting Upivot application..."
	docker-compose up

# Start in background
up-bg:
	@echo "🚀 Starting Upivot application in background..."
	docker-compose up -d

# Stop all services
down:
	@echo "🛑 Stopping Upivot application..."
	docker-compose down

# Build all containers from scratch
build:
	@echo "🔨 Building all containers..."
	docker-compose build --no-cache

# Build and start
build-up: build up

# View logs from all services
logs:
	@echo "📋 Viewing logs from all services..."
	docker-compose logs -f

# View logs from specific service
logs-api:
	docker-compose logs -f api

logs-web:
	docker-compose logs -f web

logs-mongo:
	docker-compose logs -f mongo

logs-redis:
	docker-compose logs -f redis

# Clean up - stop services and remove volumes
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Database operations
seed:
	@echo "🌱 Seeding database with sample data..."
	docker-compose exec api npm run seed

reset:
	@echo "🗑️  Resetting database..."
	docker-compose exec api npm run reset

# Development commands
dev-setup:
	@echo "⚙️  Setting up development environment..."
	cp .env.example .env
	@echo "📝 Please edit .env file with your OAuth credentials"
	@echo "🔐 Generate secrets with: openssl rand -hex 32"

# Testing
test:
	@echo "🧪 Running k6 performance tests..."
	@which k6 > /dev/null || (echo "❌ k6 not installed. Install with: brew install k6" && exit 1)
	k6 run k6/script.js

# Linting
lint:
	@echo "🔍 Running linting..."
	docker-compose exec web npm run lint
	docker-compose exec api npm run lint

# Health checks
health:
	@echo "🩺 Checking service health..."
	@echo "API Health:"
	@curl -s http://localhost:5001/api/health | jq . || echo "❌ API not responding"
	@echo "\nFrontend:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo " ✅ Frontend responding" || echo "❌ Frontend not responding"
	@echo "\nRedis:"
	@docker-compose exec redis redis-cli ping || echo "❌ Redis not responding"

# Production deployment helpers
prod-build:
	@echo "🏭 Building for production..."
	docker-compose -f docker-compose.prod.yml build

prod-up:
	@echo "🚀 Starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d

# Backup and restore
backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	docker-compose exec mongo mongodump --out /tmp/backup
	docker cp $(shell docker-compose ps -q mongo):/tmp/backup ./backups/$(shell date +%Y%m%d_%H%M%S)
	@echo "✅ Backup created in ./backups/"

restore:
	@echo "📥 Restoring database from backup..."
	@read -p "Enter backup directory name: " backup_dir; \
	docker cp ./backups/$$backup_dir $(shell docker-compose ps -q mongo):/tmp/restore && \
	docker-compose exec mongo mongorestore /tmp/restore

# Monitoring
monitor:
	@echo "📊 Opening monitoring dashboard..."
	@echo "Logs: docker-compose logs -f"
	@echo "Stats: docker stats"
	docker stats

# Quick commands for common workflows
quick-start: build-up health
	@echo "🎉 Upivot is ready!"
	@echo "Frontend: http://localhost:3000"
	@echo "API: http://localhost:5001"

quick-reset: down clean build-up seed
	@echo "🔄 Complete reset finished!"

quick-test: up-bg test down

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	docker-compose run --rm web npm install
	docker-compose run --rm api npm install
