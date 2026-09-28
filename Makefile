.PHONY: default dev dev-fe dev-be install build clean stop prisma-generate prisma-push prisma-migrate help

# Default target when simply typing `make`
default: dev

## dev: Run both frontend and backend concurrently with single Ctrl+C shutdown
dev:
	@./scripts/dev.sh

## dev-fe: Run Next.js frontend only (port 3000)
dev-fe:
	@cd frontend && npm run dev

## dev-be: Run Go backend only (port 8080)
dev-be:
	@cd backend && go run ./cmd/server

## install: Install all dependencies for both frontend and backend
install:
	@echo "📦 Installing Go backend dependencies..."
	@cd backend && go mod download
	@echo "📦 Installing Next.js frontend dependencies..."
	@cd frontend && npm install
	@echo "⚡ Generating Prisma Go Client..."
	@$(MAKE) prisma-generate

## prisma-generate: Generate Prisma Client Go types and engine
prisma-generate:
	@echo "⚡ Generating Prisma Client Go from backend/prisma/schema.prisma..."
	@cd backend && go run github.com/steebchen/prisma-client-go generate

## prisma-push: Push Prisma schema directly to PostgreSQL database
prisma-push:
	@echo "🚀 Pushing Prisma schema to database..."
	@cd backend && go run github.com/steebchen/prisma-client-go db push

## prisma-migrate: Create and apply Prisma database migrations
prisma-migrate:
	@echo "📦 Running Prisma database migrations..."
	@cd backend && go run github.com/steebchen/prisma-client-go migrate dev

## build: Build production artifacts for both projects
build:
	@echo "🔨 Building Go backend..."
	@cd backend && go build -o bin/server ./cmd/server
	@echo "🔨 Building Next.js frontend..."
	@cd frontend && npm run build

## stop: Force kill any lingering processes on ports 3000 and 8080
stop:
	@echo "🛑 Liberating port 3000 and port 8080..."
	@-lsof -ti :3000 | xargs kill -9 2>/dev/null || true
	@-lsof -ti :8080 | xargs kill -9 2>/dev/null || true
	@echo "✔ Ports cleared."

## clean: Remove build artifacts and temporary files
clean:
	@rm -rf backend/bin frontend/.next frontend/dev.log
	@echo "✔ Clean complete."

## help: Display available make targets
help:
	@echo "Available commands in Resumind:"
	@echo "  make dev             - Start both Frontend & Backend (graceful Ctrl+C shutdown)"
	@echo "  make dev-fe          - Start Frontend only"
	@echo "  make dev-be          - Start Backend only"
	@echo "  make install         - Install dependencies and generate Prisma client"
	@echo "  make prisma-generate - Generate Prisma Client Go models and queries"
	@echo "  make prisma-push     - Sync schema changes directly to PostgreSQL"
	@echo "  make prisma-migrate  - Create and run migration files"
	@echo "  make build           - Build production packages for both"
	@echo "  make stop            - Force-free ports 3000 & 8080 if stuck"
	@echo "  make clean           - Remove build artifacts"
