# 1. Build the client
FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

COPY client/ ./
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

# Update server's CORS settings to allow Railway's domain
ENV NODE_ENV=production

# Expose the port Railway will use
EXPOSE ${PORT:-8000}

# Start the server
CMD ["node", "dist/index.js"]
