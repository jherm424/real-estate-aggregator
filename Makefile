# Real Estate Aggregator - Development and Deployment Commands

.DEFAULT_GOAL := help
.PHONY: help install dev build start stop clean logs test migrate seed

# Colors for terminal output
YELLOW := \033[1;33m
GREEN := \033[1;32m
RED := \033[1;31m
BLUE := \033[1;34m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Real Estate Aggregator - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies for both backend and frontend
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	cd backend && npm install
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)Dependencies installed successfully!$(NC)"

dev: ## Start development environment with Docker
	@echo "$(GREEN)Starting development environment...$(NC)"
	cp .env.docker .env
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "$(YELLOW)Database:$(NC) http://localhost:5432"
	@echo "$(YELLOW)Backend API:$(NC) http://localhost:3001"
	@echo "$(YELLOW)Redis:$(NC) http://localhost:6379"

dev-logs: ## Show development environment logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml down
	@echo "$(GREEN)Development environment stopped!$(NC)"

build: ## Build production Docker images
	@echo "$(GREEN)Building production images...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)Production images built successfully!$(NC)"

start: ## Start production environment
	@echo "$(GREEN)Starting production environment...$(NC)"
	cp .env.docker .env
	docker-compose up -d
	@echo "$(GREEN)Production environment started!$(NC)"
	@echo "$(YELLOW)Application:$(NC) http://localhost"
	@echo "$(YELLOW)API:$(NC) http://localhost/api"

stop: ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose down
	@echo "$(GREEN)Production environment stopped!$(NC)"

restart: ## Restart production environment
	@echo "$(YELLOW)Restarting production environment...$(NC)"
	docker-compose restart
	@echo "$(GREEN)Production environment restarted!$(NC)"

logs: ## Show production environment logs
	docker-compose logs -f

logs-backend: ## Show backend logs only
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs only
	docker-compose logs -f frontend

logs-db: ## Show database logs only
	docker-compose logs -f database

status: ## Show status of all services
	@echo "$(BLUE)Service Status:$(NC)"
	docker-compose ps

clean: ## Clean up Docker containers, images, and volumes
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)Cleanup completed!$(NC)"

migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	docker-compose exec backend npm run migrate
	@echo "$(GREEN)Migrations completed!$(NC)"

seed: ## Seed database with sample data
	@echo "$(GREEN)Seeding database...$(NC)"
	docker-compose exec backend npm run seed
	@echo "$(GREEN)Database seeded!$(NC)"

scrape: ## Run manual scraping
	@echo "$(GREEN)Starting manual scraping...$(NC)"
	docker-compose exec backend npm run scrape
	@echo "$(GREEN)Manual scraping completed!$(NC)"

test-backend: ## Run backend tests
	@echo "$(GREEN)Running backend tests...$(NC)"
	cd backend && npm test

test-frontend: ## Run frontend tests
	@echo "$(GREEN)Running frontend tests...$(NC)"
	cd frontend && npm test

lint-backend: ## Lint backend code
	@echo "$(GREEN)Linting backend code...$(NC)"
	cd backend && npm run lint

lint-frontend: ## Lint frontend code
	@echo "$(GREEN)Linting frontend code...$(NC)"
	cd frontend && npm run lint

lint: lint-backend lint-frontend ## Lint all code

backup-db: ## Backup database
	@echo "$(GREEN)Backing up database...$(NC)"
	mkdir -p backups
	docker-compose exec database pg_dump -U postgres real_estate_aggregator > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Database backup completed!$(NC)"

restore-db: ## Restore database from backup (requires BACKUP_FILE variable)
	@echo "$(GREEN)Restoring database from $(BACKUP_FILE)...$(NC)"
	@if [ -z "$(BACKUP_FILE)" ]; then echo "$(RED)Error: BACKUP_FILE variable is required$(NC)"; exit 1; fi
	docker-compose exec -T database psql -U postgres real_estate_aggregator < $(BACKUP_FILE)
	@echo "$(GREEN)Database restored!$(NC)"

shell-backend: ## Access backend container shell
	docker-compose exec backend sh

shell-db: ## Access database container shell
	docker-compose exec database psql -U postgres real_estate_aggregator

monitor: ## Show real-time container stats
	docker stats

update: ## Update all Docker images
	@echo "$(GREEN)Updating Docker images...$(NC)"
	docker-compose pull
	@echo "$(GREEN)Images updated!$(NC)"

deploy: build start migrate ## Full deployment (build, start, migrate)
	@echo "$(GREEN)Deployment completed!$(NC)"
	@echo "$(YELLOW)Application is now running at:$(NC) http://localhost"

dev-setup: install dev migrate ## Complete development setup
	@echo "$(GREEN)Development setup completed!$(NC)"
	@echo "$(YELLOW)Backend API:$(NC) http://localhost:3001"
	@echo "$(YELLOW)Frontend will be available at:$(NC) http://localhost:3000 (run 'cd frontend && npm run dev' separately)"