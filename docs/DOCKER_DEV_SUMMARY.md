# Docker Development Environment - Summary

## What Was Created

### Configuration Files

1. **`docker-compose.dev.yml`** - Docker Compose configuration for development
   - Separate services for backend, frontend, and sqlite-web
   - Hot reload support via volume mounts
   - Named volumes for node_modules to avoid conflicts
   - Bridge network for inter-service communication

2. **`Dockerfile.dev`** - Multi-stage Dockerfile for development
   - Backend stage with tsx for TypeScript execution
   - Frontend stage with Vite dev server
   - Includes native module build support (sqlite3, bcrypt)

3. **`.dockerignore`** - Optimized Docker build context
   - Excludes node_modules, dist, logs, etc.
   - Reduces build time and image size

### Helper Scripts

4. **`Makefile`** - Command shortcuts for Linux/Mac
   - `make dev` - Start development
   - `make seed` - Seed database
   - `make clean` - Clean up containers
   - And more...

5. **`dev.bat`** - Command shortcuts for Windows
   - `dev.bat start` - Start development
   - `dev.bat seed` - Seed database
   - `dev.bat clean` - Clean up containers
   - And more...

### Documentation

6. **`DEV_SETUP.md`** - Comprehensive development guide
   - Quick start instructions
   - Development workflow
   - Troubleshooting tips
   - Architecture diagram

7. **`README.md`** - Updated with Docker dev instructions

### Modified Files

8. **`frontend/vite.config.ts`** - Updated for Docker compatibility
   - Changed port to 5173 (standard Vite port)
   - Added `host: true` for Docker networking
   - Added `usePolling: true` for hot reload in Docker
   - Environment-based API proxy configuration

## Key Features

### Hot Reload Support

- **Backend**: Changes to `backend/src/**/*.ts` automatically restart the server
- **Frontend**: Changes to `frontend/src/**/*` trigger instant HMR (Hot Module Replacement)
- No need to rebuild containers for code changes

### Volume Mounts

Source code is mounted as volumes:
```
./backend/src → /app/backend/src
./frontend/src → /app/frontend/src
./data → /data (database persistence)
```

node_modules are in named volumes to avoid Windows/Mac compatibility issues.

### Service Architecture

```
┌─────────────────────────────────────────────────┐
│           Docker Network: cali-dev              │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐   ┌──────────┐   ┌────────────┐  │
│  │ Frontend │   │ Backend  │   │ SQLite Web │  │
│  │  :5173   │──►│  :8080   │◄──│   :8081    │  │
│  └──────────┘   └──────────┘   └────────────┘  │
│                       │                          │
│                       ▼                          │
│                  ┌─────────┐                     │
│                  │ cali.db │                     │
│                  └─────────┘                     │
└─────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    localhost:5173  localhost:8080  localhost:8081
```

### Environment Variables

**Backend**:
- `NODE_ENV=development`
- `PORT=8080`
- `DB_PATH=/data/cali.db`

**Frontend**:
- `NODE_ENV=development`
- `VITE_API_URL=http://backend:8080`

## Usage

### Quick Start

```bash
# Using yarn (recommended - works on all platforms)
yarn dev-build

# Windows
dev.bat build

# Linux/Mac
make dev-build

# Manual
docker compose -f docker-compose.dev.yml up --build
```

### Common Commands

| Action | Yarn | Windows | Linux/Mac | Manual |
|--------|------|---------|-----------|--------|
| Start dev | `yarn dev` | `dev.bat start` | `make dev` | `docker compose -f docker-compose.dev.yml up` |
| Build & start | `yarn dev-build` | `dev.bat build` | `make dev-build` | `docker compose -f docker-compose.dev.yml up --build` |
| Stop | `yarn dev-down` | `dev.bat stop` | `make dev-down` | `docker compose -f docker-compose.dev.yml down` |
| Seed DB | `yarn dev-seed` | `dev.bat seed` | `make seed` | `docker compose -f docker-compose.dev.yml exec backend yarn db:seed` |
| Run tests | `yarn dev-test` | - | `make test` | `docker compose -f docker-compose.dev.yml exec backend yarn test` |
| View logs | `yarn dev-logs` | `dev.bat logs` | `make dev-logs` | `docker compose -f docker-compose.dev.yml logs -f` |
| Clean rebuild | `yarn dev-clean` | `dev.bat clean` | `make clean` | `docker compose -f docker-compose.dev.yml down -v && docker compose -f docker-compose.dev.yml up --build` |

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **Database UI**: http://localhost:8081

## Database

- **Location**: `./data/cali.db` (persisted on host)
- **Tables**: 8 tables (users, calendar_events, family_members, sms_history, join_codes, calendar_integrations, admin_settings, system_setup)
- **Default Admin**:
  - Email: `admin@localhost`
  - Password: `admin123`

## Benefits

✅ **Hot Reload** - Instant feedback on code changes
✅ **Isolated Environment** - No need to install Node.js locally
✅ **Consistent Setup** - Same environment for all developers
✅ **Database Viewer** - Built-in SQLite web interface
✅ **Multi-Platform** - Works on Windows, Mac, Linux
✅ **Production Parity** - Dev environment mirrors production

## Troubleshooting

### Hot reload not working?
```bash
# Restart services
docker compose -f docker-compose.dev.yml restart
```

### Node modules issues?
```bash
# Clean rebuild
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

### Database locked?
```bash
# Stop containers and remove database
docker compose -f docker-compose.dev.yml down
rm data/cali.db
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec backend yarn db:seed
```

### Port conflicts?
Edit `docker-compose.dev.yml` and change the host port (left side of the colon):
```yaml
ports:
  - "5174:5173"  # Changed from 5173:5173
```

## Next Steps

1. Start the development environment
2. Make changes to the code - they'll hot reload automatically
3. View the database at http://localhost:8081
4. Check out [DEV_SETUP.md](./DEV_SETUP.md) for detailed docs
5. Continue with Phase 3 implementation (Authentication System)
