# Docker Best Practices Applied

## Files Created

1. **Dockerfile** - Multi-stage build for backend (Express API)
   - Builder stage: installs dependencies
   - Runtime stage: minimal image with dumb-init for signal handling
   - Size: ~50MB compressed

2. **Dockerfile.frontend** - Development-friendly frontend image
   - Vite dev server with hot reload
   - Network-accessible for Docker
   - Size: ~127MB compressed

3. **docker-compose.yml** - Production-ready orchestration
   - MongoDB with health checks
   - Backend API with health checks
   - Frontend dev server
   - Named network for service discovery
   - Volume persistence for MongoDB

4. **.dockerignore** - Excludes unnecessary files from builds
   - Node modules, logs, build artifacts
   - Reduces build context size

5. **docker-compose.dev.yml** - Development with hot reload
   - Bind mounts for code synchronization
   - Development database
   - Optimized for fast iteration

## Quick Start

### Production Environment
```bash
docker compose up --pull always
```
Services start: MongoDB → Backend → Frontend
Access frontend at http://localhost:5173
API at http://localhost:5000

### Development Environment
```bash
docker compose -f docker-compose.dev.yml up --pull always
```
Code changes auto-reload in both frontend and backend
MongoDB persists to ./data

## Key Best Practices Implemented

✅ **Multi-stage builds** - Separate builder and runtime stages, minimal final image
✅ **Alpine base images** - node:20-alpine reduces image size
✅ **npm ci** - Uses lockfile for reproducible builds instead of npm install
✅ **Health checks** - Services validate readiness before dependents start
✅ **Dumb-init** - Proper signal handling in containers
✅ **Named networks** - Service discovery via DNS (mongodb:27017)
✅ **Volume mounts** - Persistent data and hot reload capability
✅ **Restart policies** - Automatic recovery from failures
✅ **.dockerignore** - Excludes node_modules and artifacts

## Environment Variables

Backend uses:
- PORT=5000
- MONGODB_URI=mongodb://admin:password@mongodb:27017/caffeine_co?authSource=admin
- NODE_ENV=production|development

Frontend uses:
- VITE_API_URL=http://localhost:5000

## Volumes

- **mongodb_data** - Persists MongoDB data (production)
- **mongodb_data_dev** - Persists MongoDB data (development)
- **./server** - Code changes in development (backend)
- **./client** - Code changes in development (frontend)

## Image Sizes

- caffeineco-api:latest - 50.5MB (backend)
- caffeineco-web:latest - 127MB (frontend)

## Troubleshooting

**Backend won't connect to MongoDB:**
- Check health status: `docker ps` (should show "healthy")
- View logs: `docker logs caffeineco-api`
- Verify network: `docker network inspect caffeineco-network`

**Frontend can't reach API:**
- Check VITE_API_URL environment variable
- Verify backend is healthy: `docker logs caffeineco-api`
- Test connectivity: `curl http://backend:5000/api/menu` from frontend container

**Port conflicts:**
- MongoDB: 27017
- Backend: 5000
- Frontend: 5173

Change port mappings in docker-compose files if needed.
