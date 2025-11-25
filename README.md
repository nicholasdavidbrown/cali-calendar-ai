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

### Production (Docker)

1. **Start the application:**
   ```bash
   docker compose up --build
   ```

2. **Access the services:**
   - Frontend + API: http://localhost:8080
   - SQLite Web Viewer: http://localhost:8081

3. **Stop the application:**
   ```bash
   docker compose down
   ```

### Local Development

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
   yarn dev-backend
   ```

4. **Start frontend (Terminal 2):**
   ```bash
   yarn dev-frontend
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173 (Vite dev server with HMR)
   - API: http://localhost:8080

## Available Scripts

### Docker Commands

| Command | Shorthand | Description |
|---------|-----------|-------------|
| `docker compose up` | `yarn up` | Start containers with existing images |
| `docker compose up --build` | `yarn up-build` | Start containers and rebuild if needed |
| `docker compose down` | `yarn down` | Stop and remove containers |
| `docker compose down -v && docker system prune -f` | `yarn clean` | Remove containers, volumes, and clean Docker system |
| `docker compose down && docker compose build --no-cache && docker compose up` | `yarn rebuild` | Full clean rebuild (no cache) |
| `docker compose logs -f` | `yarn logs` | Follow container logs in real-time |
| `docker compose restart` | `yarn restart` | Restart all containers |

### Development Commands

| Command | Description |
|---------|-------------|
| `yarn dev-frontend` | Run frontend dev server with HMR |
| `yarn dev-backend` | Run backend in development mode |

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

### myapp
- **Port:** 8080:8080
- **Purpose:** Serves both frontend and backend API
- **Volume:** `./data:/data` - Persistent database storage
- **Restart:** unless-stopped

### sqlite-web
- **Port:** 8081:8081
- **Purpose:** Web-based SQLite database viewer
- **Volume:** `./data:/data` - Access to application database
- **Restart:** unless-stopped

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
If ports 8080 or 8081 are in use, either:
- Stop the conflicting service
- Modify ports in `docker-compose.yml`

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
