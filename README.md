# SERN Lite Compose Template

A full-stack web application template using SQLite, Express, React, and Node.js with Docker Compose for easy deployment. This template is designed for small-scale self-hosted projects and such uses SQLite.

## Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS** - Styling with dark/light mode support

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **SQLite** - Embedded database
- **sqlite3** - Database driver

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **sqlite-web** - Web-based SQLite database viewer

## Project Structure

```
.
├── backend/              # Express API server
│   ├── src/
│   │   └── index.ts     # Main server file
│   ├── dist/            # Compiled output
│   └── package.json
├── frontend/            # React application
│   ├── src/
│   │   ├── App.tsx      # Main app component
│   │   ├── App.css      # Styles
│   │   └── main.tsx     # Entry point
│   ├── dist/            # Build output
│   └── package.json
├── data/                # SQLite database storage (gitignored)
├── docker-compose.yml   # Docker services configuration
├── Dockerfile           # Multi-stage build for production
└── package.json         # Root package with scripts

```

## Requirements

### For Docker Deployment (Recommended)
- **Docker**: 20.10+ or later
- **Docker Compose**: 2.0+ or later (v2 CLI)

### For Local Development
- **Node.js**: 20.x or later
- **Yarn**: 4.x (Berry) via Corepack
  - Enable with: `corepack enable`
  - Corepack comes bundled with Node.js 16.10+
- **Git**: Any recent version

### Optional Tools
- **SQLite CLI**: For manual database inspection (not required - sqlite-web provides a UI)

## Quick Start

### Prerequisites
Ensure you have the required versions listed in the Requirements section above.

### Docker Development (Recommended)

**For detailed instructions, see [DEV_SETUP.md](./DEV_SETUP.md)**

1. **Start development environment with hot reload:**
   ```bash
   # Using yarn (any platform)
   yarn dev-build

   # Windows
   dev.bat build

   # Linux/Mac
   make dev-build

   # Or manually
   docker compose -f docker-compose.dev.yml up --build
   ```

2. **Access the services:**
   - Frontend (React + Vite): http://localhost:5173
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health
   - SQLite Web Viewer: http://localhost:8081

3. **Seed the database:**
   ```bash
   # Using yarn (any platform)
   yarn dev-seed

   # Windows
   dev.bat seed

   # Linux/Mac
   make seed

   # Or manually
   docker compose -f docker-compose.dev.yml exec backend yarn db:seed
   ```

4. **Default admin credentials:**
   - Email: `admin@localhost`
   - Password: `admin123`

5. **Stop the environment:**
   ```bash
   # Using yarn (any platform)
   yarn dev-down

   # Windows
   dev.bat stop

   # Linux/Mac
   make dev-down
   ```

### Production (Docker)

1. **Start the application:**
   ```bash
   docker compose up --build
   ```

2. **Access the services:**
   - Frontend + API: http://localhost:8082
   - SQLite Web Viewer: http://localhost:8083

3. **Stop the application:**
   ```bash
   docker compose down
   ```

### Local Development (Without Docker)

1. **Enable Yarn 4 (first time setup):**
   ```bash
   corepack enable
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Start backend (Terminal 1):**
   ```bash
   cd backend
   yarn db:seed  # First time only
   yarn dev
   ```

4. **Start frontend (Terminal 2):**
   ```bash
   cd frontend
   yarn dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173 (Vite dev server with HMR)
   - API: http://localhost:8080

## Available Scripts

### Docker Development Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development environment (hot reload) |
| `yarn dev-build` | Build and start development environment |
| `yarn dev-down` | Stop development environment |
| `yarn dev-clean` | Clean rebuild (remove volumes and rebuild) |
| `yarn dev-logs` | View development logs |
| `yarn dev-seed` | Seed database in development |
| `yarn dev-test` | Run tests in Docker container |

### Docker Production Commands

| Command | Description |
|---------|-------------|
| `yarn up` | Start production containers |
| `yarn up-build` | Build and start production containers |
| `yarn down` | Stop and remove containers |
| `yarn clean` | Remove containers, volumes, and clean Docker system |
| `yarn rebuild` | Full clean rebuild (no cache) |
| `yarn logs` | Follow container logs in real-time |
| `yarn restart` | Restart all containers |

### Local Development Commands

| Command | Description |
|---------|-------------|
| `yarn local-frontend` | Run frontend dev server with HMR (no Docker) |
| `yarn local-backend` | Run backend in development mode (no Docker) |

### Testing Commands

| Command | Description |
|---------|-------------|
| `yarn test` | Run all unit tests |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test:coverage` | Run tests with coverage report |

## API Endpoints

### Users

#### Get All Users
```http
GET /api/users
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe"
  }
]
```

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "Jane Doe"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Jane Doe"
}
```

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `NODE_ENV` | `production` | Environment mode |
| `DB_PATH` | `/data/db.sqlite` | SQLite database path |
| `TZ` | `Australia/Brisbane` | Timezone |

## Docker Services

### Production (docker-compose.yml)

#### cali
- **Port:** 8082:8080 (external:internal)
- **Purpose:** Serves both frontend and backend API
- **Volume:** `./data:/data` - Persistent database storage
- **Restart:** unless-stopped

#### sqlite-web
- **Port:** 8083:8081 (external:internal)
- **Purpose:** Web-based SQLite database viewer
- **Volume:** `./data:/data` - Access to application database
- **Restart:** unless-stopped

### Development (docker-compose.dev.yml)

#### backend
- **Port:** 8080:8080
- **Purpose:** Express API server with hot reload

#### frontend
- **Port:** 5173:5173
- **Purpose:** Vite dev server with HMR

#### sqlite-web
- **Port:** 8081:8081
- **Purpose:** Web-based SQLite database viewer

## Development Workflow

### Making Changes

1. **Frontend changes:**
   - Edit files in `frontend/src/`
   - Changes are reflected immediately with HMR in dev mode
   - For Docker: `docker compose up --build`

2. **Backend changes:**
   - Edit files in `backend/src/`
   - For Docker: `docker compose up --build`

3. **Dependency changes:**
   - Update package.json in respective folder
   - Run `docker compose down && docker compose build --no-cache && docker compose up` for clean Docker build

### Viewing the Database

Access http://localhost:8081 to view and query your SQLite database using the web interface.

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);
```

## Features

- Full-stack TypeScript support
- Hot Module Replacement (HMR) in development
- Multi-stage Docker builds for optimized production images
- **Multi-architecture support** (AMD64, ARM64, x86)
- Persistent SQLite database with web viewer
- Dark/Light mode support in UI
- RESTful API design
- Containerized development and production environments

## Multi-Architecture Support

This project is designed to work seamlessly across different CPU architectures:

- **AMD64/x86_64** - Intel/AMD processors (most common)
- **ARM64/aarch64** - Apple Silicon (M1/M2/M3), AWS Graviton, Raspberry Pi 4+
- **x86** - Older 32-bit systems (via emulation)

### How it Works

1. **Base Images**: Uses official `node:20-alpine` multi-arch images
2. **Native Compilation**: sqlite3 module is compiled from source during build for the target architecture
3. **Platform Detection**: Docker automatically detects your system architecture and builds accordingly
4. **Cross-Platform Compatible**: The same `docker-compose.yml` works on all architectures

### No Special Configuration Needed

Simply run on any supported platform:
```bash
docker compose up --build
```

Docker will automatically:
- Pull the correct base images for your architecture
- Compile native dependencies (sqlite3) for your platform
- Build an optimized container that runs natively

### Notes

- **sqlite-web**: Uses linux/amd64 with emulation on ARM (slight performance impact, but works fine)
- **Performance**: Native builds provide best performance on all platforms
- **Apple Silicon**: Fully supported - no Rosetta needed for the main app

## Troubleshooting

### Port already in use
**Development ports:** 5173, 8080, 8081
**Production ports:** 8082, 8083

If any of these ports are in use:
- Stop the conflicting service
- Modify the external port (left side) in the respective docker-compose file
- Note: Dev and prod can run simultaneously without conflicts

### Database locked
If you get "database is locked" errors:
- Stop all containers: `docker compose down`
- Remove volumes: `docker compose down -v && docker system prune -f`
- Restart: `docker compose up --build`

### Clean rebuild needed
If you encounter issues after dependency changes:
```bash
docker compose down && docker compose build --no-cache && docker compose up
```

This performs a complete rebuild without cache.

## License

MIT

---

*Vibed by Claude and quality checked by Nick Brown*
