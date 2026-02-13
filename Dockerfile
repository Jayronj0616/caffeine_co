# Multi-stage Dockerfile for Node.js monorepo backend

# ============ BACKEND BUILDER ============
FROM node:20-alpine AS backend-builder
WORKDIR /app/server

# Copy backend package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci

# ============ RUNTIME ============
FROM node:20-alpine AS backend-final

# Backend runtime setup
WORKDIR /app/server
ENV NODE_ENV=production

# Copy installed dependencies from builder
COPY --from=backend-builder /app/server/node_modules ./node_modules

# Copy application code
COPY server/index.js .
COPY server/.env .

# Expose backend port
EXPOSE 5000

# Start backend server
CMD ["node", "index.js"]
