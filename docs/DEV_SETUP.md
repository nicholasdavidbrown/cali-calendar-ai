# Development Setup Guide

This guide covers local development using Docker Compose with hot reload support.

## Prerequisites

- Docker Desktop installed and running
- Git

## Quick Start

### 1. Start Development Environment

```bash
# Using yarn (recommended - works on all platforms)
yarn dev-build

# Or start in detached mode
yarn dev-build -d

# Alternative methods:
# Windows
dev.bat build

# Linux/Mac
make dev-build

# Manual
docker compose -f docker-compose.dev.yml up --build
```

### 2. Access Services

- **Frontend (React + Vite)**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **SQLite Web UI**: http://localhost:8081

### 3. View Logs

```bash
# Using yarn
yarn dev-logs

# Or manually
docker compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

### 4. Stop Services

```bash
# Using yarn
yarn dev-down

# Or manually
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes
yarn dev-clean  # This also rebuilds after cleaning
```

## Development Workflow

### Hot Reload

Both backend and frontend support hot reload:

- **Frontend**: Edit files in `frontend/src/` - Vite will automatically reload
- **Backend**: Edit files in `backend/src/` - tsx will automatically restart

### Database Management

The SQLite database is persisted in the `./data` directory on your host machine.

#### Seed the Database

```bash
# Using yarn (recommended)
yarn dev-seed

# Or manually
docker compose -f docker-compose.dev.yml exec backend yarn db:seed
```

#### Run Migrations

```bash
# Run migrations inside container
docker compose -f docker-compose.dev.yml exec backend yarn db:migrate
```

#### Access Database via SQLite Web

Open http://localhost:8081 in your browser to view and query the database directly.

### Running Commands in Containers

```bash
# Backend shell
docker compose -f docker-compose.dev.yml exec backend sh

# Frontend shell
docker compose -f docker-compose.dev.yml exec frontend sh

# Run tests
yarn dev-test  # From root
docker compose -f docker-compose.dev.yml exec backend yarn test  # Manual

# Install new backend dependency
docker compose -f docker-compose.dev.yml exec backend yarn add package-name

# Install new frontend dependency
docker compose -f docker-compose.dev.yml exec frontend yarn add package-name
```

## Troubleshooting

### Hot Reload Not Working

If hot reload isn't working:

1. Make sure file polling is enabled in `vite.config.ts` (already configured)
2. Restart the containers:
   ```bash
   docker compose -f docker-compose.dev.yml restart
   ```

### Port Already in Use

If you get a port conflict error:

```bash
# Find what's using the port (example for port 8080)
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080

# Kill the process or change the port in docker-compose.dev.yml
```

### Node Modules Issues

If you encounter dependency issues:

```bash
# Remove volumes and rebuild
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

### Database Issues

If the database gets corrupted or you want to start fresh:

```bash
# Stop containers
docker compose -f docker-compose.dev.yml down

# Remove database file
rm data/cali.db

# Restart and seed
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec backend yarn db:seed
```

## Local Development (Without Docker)

If you prefer to run without Docker:

### Backend

```bash
cd backend
yarn install
yarn db:seed
yarn dev
```

### Frontend

```bash
cd frontend
yarn install
yarn dev
```

## Environment Variables

Create a `.env` file in the root directory for custom configuration:

```env
# Backend
PORT=8080
DB_PATH=/data/cali.db
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:8080
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docker Development Environment                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Frontend   │  │   Backend    │  │ SQLite Web │ │
│  │   (Vite)     │  │   (Express)  │  │   Viewer   │ │
│  │ Port: 5173   │  │  Port: 8080  │  │ Port: 8081 │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                 │        │
│         │  API Proxy      │                 │        │
│         └────────────────►│                 │        │
│                           │                 │        │
│                           ▼                 ▼        │
│                     ┌──────────────────────────┐     │
│                     │   SQLite Database        │     │
│                     │   ./data/cali.db         │     │
│                     └──────────────────────────┘     │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## Default Admin Credentials

After seeding the database:

- **Email**: admin@localhost
- **Password**: admin123

⚠️ **Important**: Change these credentials after first login!

## Next Steps

1. Start the dev environment
2. Access the frontend at http://localhost:5173
3. Check the backend health at http://localhost:8080/health
4. View the database at http://localhost:8081
5. Start coding - changes will hot reload automatically!
