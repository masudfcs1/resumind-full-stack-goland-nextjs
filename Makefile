.PHONY: default dev dev-fe dev-be install build clean stop help

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
	@cd backend-go && go run ./cmd/server

## install: Install all dependencies for both frontend and backend
install:
	@echo "📦 Installing Go backend dependencies..."
	@cd backend-go && go mod download
	@echo "📦 Installing Next.js frontend dependencies..."
	@cd frontend && npm install

## build: Build production artifacts for both projects
build:
	@echo "🔨 Building Go backend..."
	@cd backend-go && go build -o bin/server ./cmd/server
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
	@rm -rf backend-go/bin frontend/.next frontend/dev.log
	@echo "✔ Clean complete."

## help: Display available make targets
help:
	@echo "Available commands in Resumind:"
	@echo "  make dev      - Start both Frontend & Backend (graceful Ctrl+C shutdown)"
	@echo "  make dev-fe   - Start Frontend only"
	@echo "  make dev-be   - Start Backend only"
	@echo "  make install  - Install dependencies for both projects"
	@echo "  make build    - Build production packages for both"
	@echo "  make stop     - Force-free ports 3000 & 8080 if stuck"
	@echo "  make clean    - Remove build artifacts"
