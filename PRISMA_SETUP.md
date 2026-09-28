# ⚡ Prisma Client Go Setup & Usage Guide

This document explains how **Prisma Client Go** is configured, implemented, and executed in the Resumind full-stack project.

---

## 📌 Architecture Overview

Resumind uses **[Prisma Client Go](https://github.com/steebchen/prisma-client-go)** as the type-safe ORM for the Go/Chi backend.

```
resumind/
├── Makefile                     # Root commands: make prisma-generate, make dev, etc.
├── package.json                 # npm run prisma:generate
└── backend-go/
    ├── .env                     # Contains DATABASE_URL (PostgreSQL)
    ├── prisma/
    │   └── schema.prisma        # Database models & Prisma generator config
    └── internal/
        └── database/
            ├── prisma.go        # Database connection lifecycle & PgBouncer integration
            └── db/              # Auto-generated Go client package (DO NOT EDIT MANUALLY)
                ├── db_gen.go    # Type-safe Go structs & query builders
                └── *_gen.go     # Query engine binary wrapper
```

---

## ⚙️ Configuration

In [`backend-go/prisma/schema.prisma`](backend-go/prisma/schema.prisma):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "go run github.com/steebchen/prisma-client-go"
  output   = "../internal/database/db"
  package  = "db"
}
```

- **`provider`**: Tells Prisma CLI to invoke the Go generator tool.
- **`output`**: Specifies where the Go code should be generated (`internal/database/db`).
- **`package`**: Sets the Go package name to `db`.

---

## 🚀 How to Run the Prisma Generator

You can run the generator using any of the following single commands:

### Option 1: Root Makefile (Recommended)
From the root `resumind/` directory:
```bash
make prisma-generate
```

### Option 2: Root npm script
From the root `resumind/` directory:
```bash
npm run prisma:generate
```

### Option 3: Direct Go CLI
Inside the `backend-go` directory:
```bash
cd backend-go
go run github.com/steebchen/prisma-client-go generate
```

---

## 🗄️ Database Workflow Commands

| Action | Root Command | Direct Command (in `backend-go/`) |
| :--- | :--- | :--- |
| **Generate Go Client** | `make prisma-generate` | `go run github.com/steebchen/prisma-client-go generate` |
| **Push Schema to DB (Dev Sync)** | `make prisma-push` | `go run github.com/steebchen/prisma-client-go db push` |
| **Create/Run Migrations** | `make prisma-migrate` | `go run github.com/steebchen/prisma-client-go migrate dev` |
| **Install & Auto-Generate** | `make install` | `cd backend-go && go mod download && make generate` |

---

## 🛠️ Step-by-Step Workflow: Modifying the Schema

Whenever you add or change database models:

### 1. Edit the Schema
Open [`backend-go/prisma/schema.prisma`](backend-go/prisma/schema.prisma) and define your model:

```prisma
model Resume {
  id        String   @id @default(uuid())
  title     String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content   String   // JSON or text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Push Schema or Migrate
Sync your changes with your PostgreSQL database:
```bash
make prisma-push
```

### 3. Generate the Go Client
Regenerate the Go type definitions:
```bash
make prisma-generate
```

---

## 💻 Using the Generated Client in Go Code

### Initializing the Client
In [`backend-go/internal/database/prisma.go`](backend-go/internal/database/prisma.go):
```go
package database

import "go-mini-setup/internal/database/db"

type DB struct {
    Client *db.PrismaClient
}

func New() (*DB, error) {
    client := db.NewClient()
    if err := client.Prisma.Connect(); err != nil {
        return nil, err
    }
    return &DB{Client: client}, nil
}
```

### Querying Data
In your services or repositories:
```go
import "go-mini-setup/internal/database/db"

// Find a user by email
user, err := client.User.FindUnique(
    db.User.Email.Equals("alex@example.com"),
).Exec(ctx)

// Create a new user
newUser, err := client.User.CreateOne(
    db.User.Email.Set("alex@example.com"),
    db.User.Name.Set("Alex Chen"),
    db.User.Role.Set(db.RoleUser),
).Exec(ctx)
```

---

## 🔒 Git & CI/CD Best Practices

1. **`*_gen.go` Files Are Ignored by Default**:
   The generated Go files are automatically ignored in [`backend-go/internal/database/db/.gitignore`](backend-go/internal/database/db/.gitignore) to keep repository size lean and prevent merge conflicts.
2. **Automated Generation**:
   When cloning or setting up on a new machine:
   ```bash
   make install
   ```
   This will install all dependencies for both frontend and backend and automatically run `prisma-generate`.

---

## ❓ Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `undefined: db.PrismaClient` | Client hasn't been generated yet | Run `make prisma-generate` |
| `failed to connect to database via Prisma` | Invalid or unreachable `DATABASE_URL` | Check `backend-go/.env` connection string |
| `bind: address already in use` | Old dev server still running | Run `make stop` to free ports 3000 and 8080 |
