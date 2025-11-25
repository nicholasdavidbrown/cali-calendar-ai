# ---- Frontend build stage ----
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Enable corepack to use Yarn 4
RUN corepack enable

COPY frontend/package.json frontend/yarn.lock frontend/.yarnrc.yml* ./
COPY .yarnrc.yml* ./

RUN yarn install

COPY frontend/ ./
RUN yarn build

# ---- Backend build stage ----
FROM node:20-alpine AS backend-build

WORKDIR /app/backend

# Enable corepack to use Yarn 4
RUN corepack enable

# Install build dependencies for native modules (sqlite3)
RUN apk add --no-cache python3 make g++ py3-setuptools

COPY backend/package.json backend/yarn.lock backend/.yarnrc.yml* ./
COPY .yarnrc.yml* ../

# Install dependencies - this will build native modules for Linux
RUN yarn install

# Force rebuild sqlite3 for the correct architecture
RUN cd /app/backend/node_modules/sqlite3 && npm run install --build-from-source

COPY backend/ ./
RUN yarn build

# ---- Final runtime image ----
FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /data

# Copy compiled backend and its dependencies
COPY --from=backend-build /app/backend/dist /app/backend/dist
COPY --from=backend-build /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-build /app/backend/package.json /app/backend/package.json

# Copy compiled frontend
COPY --from=frontend-build /app/frontend/dist /app/frontend_dist

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/db.sqlite

WORKDIR /app/backend

EXPOSE 8080

CMD ["node", "dist/index.js"]
