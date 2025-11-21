# ===================================
# Part 1: Run the build
# ===================================
FROM node:18-slim AS build

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY packages/client/package.json .

# Install frontend dependencies
RUN npm install --silent

# Copy frontend files
COPY packages/client/ .

# Build arguments
ARG NODE_ENV
ARG GENERATE_SOURCEMAP
ARG VITE_APP_ENV

# Set environment variables
ENV NODE_ENV=$NODE_ENV
ENV GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP
ENV VITE_APP_ENV=$VITE_APP_ENV

# Build frontend
RUN npm run build

# ===================================
# Part 2: Build the production image
# ===================================
FROM nginx:alpine

# Copy nginx configuration
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build files from the build image
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
