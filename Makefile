# Cali Calendar AI - Development Makefile

.PHONY: help dev dev-build dev-down dev-logs dev-restart clean seed migrate backend-shell frontend-shell db-ui test

# Default target
help:
	@echo "🚀 Cali Calendar AI Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build and start development environment"
	@echo "  make dev-down     - Stop development environment"
	@echo "  make dev-logs     - View all logs"
	@echo "  make dev-restart  - Restart all services"
	@echo ""
	@echo "Database:"
	@echo "  make seed         - Seed database with initial data"
	@echo "  make migrate      - Run database migrations"
	@echo "  make db-ui        - Open SQLite web interface"
	@echo ""
	@echo "Utilities:"
	@echo "  make backend-shell   - Open backend container shell"
	@echo "  make frontend-shell  - Open frontend container shell"
	@echo "  make clean          - Remove all containers and volumes"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start production"

# Development commands
dev:
	@echo "🚀 Starting development environment..."
	docker compose -f docker-compose.dev.yml up

dev-build:
	@echo "🔨 Building and starting development environment..."
	docker compose -f docker-compose.dev.yml up --build

dev-down:
	@echo "⏹️  Stopping development environment..."
	docker compose -f docker-compose.dev.yml down

dev-logs:
	@echo "📋 Viewing logs..."
	docker compose -f docker-compose.dev.yml logs -f

dev-restart:
	@echo "🔄 Restarting services..."
	docker compose -f docker-compose.dev.yml restart

# Database commands
seed:
	@echo "🌱 Seeding database..."
	docker compose -f docker-compose.dev.yml exec backend yarn db:seed

migrate:
	@echo "📊 Running migrations..."
	docker compose -f docker-compose.dev.yml exec backend yarn db:migrate

db-ui:
	@echo "🗄️  Opening SQLite Web UI at http://localhost:8081"
	@which xdg-open > /dev/null 2>&1 && xdg-open http://localhost:8081 || \
	 which open > /dev/null 2>&1 && open http://localhost:8081 || \
	 which start > /dev/null 2>&1 && start http://localhost:8081 || \
	 echo "Please open http://localhost:8081 in your browser"

# Shell access
backend-shell:
	@echo "🐚 Opening backend shell..."
	docker compose -f docker-compose.dev.yml exec backend sh

frontend-shell:
	@echo "🐚 Opening frontend shell..."
	docker compose -f docker-compose.dev.yml exec frontend sh

# Cleanup
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker compose -f docker-compose.dev.yml down -v
	@echo "✅ Cleanup complete"

# Production commands
prod:
	@echo "🚀 Starting production environment..."
	docker compose up

prod-build:
	@echo "🔨 Building and starting production..."
	docker compose up --build

# Test commands
test:
	@echo "🧪 Running tests..."
	@echo "Tests not yet implemented"
