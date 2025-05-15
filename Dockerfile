# 1. Build the client
FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

COPY client/ ./
# Build with production URL
ENV VITE_API_URL=/api
RUN npm run build

# 2. Build the server
FROM node:20-alpine AS server-builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# 3. Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built server
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy client build to public directory 
COPY --from=client-builder /app/client/dist ./public

# Set production environment
ENV NODE_ENV=production
# Don't hardcode URLs in the environment
ENV CORS_ORIGIN="*"

# Expose the port Railway will use
EXPOSE ${PORT:-8000}

# Print directory contents to debug
CMD echo "Starting server..." && \
    echo "Contents of /app:" && \
    ls -la && \
    echo "Contents of /app/public:" && \
    ls -la public && \
    echo "Contents of /app/dist:" && \
    ls -la dist && \
    node dist/index.js
