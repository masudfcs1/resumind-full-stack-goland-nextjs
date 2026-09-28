# Resumind Full-Stack (Go + Next.js)

An enterprise-ready full-stack application combining a **Next.js** frontend with a high-performance **Go (Golang) + Chi + Prisma Client Go** backend.

---

## 🚀 Quickstart

Run both frontend and backend concurrently with a single command:

```bash
# 1. Install dependencies & generate Prisma client
make install

# 2. Run both Frontend (3000) & Backend (8080) with unified logs
make dev
# or:
npm run dev
```

> **Clean Shutdown**: Press `Ctrl + C` anytime in your terminal to cleanly terminate both services and liberate ports.

---

## ⚡ Prisma Database Workflows

For detailed documentation, refer to **[PRISMA_SETUP.md](PRISMA_SETUP.md)**.

| Command | Description |
| :--- | :--- |
| `make prisma-generate` | Generate type-safe Go structs and Prisma client in `backend/internal/database/db/` |
| `make prisma-push` | Sync schema directly with your PostgreSQL database without migration files |
| `make prisma-migrate` | Create and apply versioned database migrations |

---

## 📁 Repository Structure

```
resumind/
├── Makefile                     # Root automation (make dev, make prisma-generate, etc.)
├── package.json                 # Monorepo scripts (npm run dev, npm run prisma:generate)
├── PRISMA_SETUP.md              # Complete Prisma Client Go setup & reference guide
├── scripts/
│   └── dev.sh                   # Concurrent dev server runner with Ctrl+C trap
├── frontend/                    # Next.js 16 app (port 3000)
└── backend/                     # Go / Chi API server (port 8080)
    ├── prisma/
    │   └── schema.prisma        # PostgreSQL models & generator configuration
    ├── internal/
    │   └── database/            # Prisma Go client and database connection logic
    └── cmd/
        └── server/              # Backend main entry point
```

---

## 🛠️ All Available Commands

| Command | Description |
| :--- | :--- |
| `make dev` | Start both Frontend and Backend concurrently |
| `make dev-fe` | Start Frontend only (`http://localhost:3000`) |
| `make dev-be` | Start Backend only (`http://localhost:8080`) |
| `make install` | Install all dependencies and generate Prisma client |
| `make prisma-generate` | Run Prisma Go generator |
| `make prisma-push` | Push schema changes to database |
| `make prisma-migrate` | Run database migrations |
| `make build` | Build production artifacts for both apps |
| `make stop` | Force kill any lingering processes on ports 3000/8080 |
| `make clean` | Clean build artifacts and logs |
