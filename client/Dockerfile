# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the client code
COPY . .

# Update environment file for Docker
RUN echo "VITE_API_URL=http://localhost:8000/api" > .env

# Build the application
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine

# Copy built files from build stage to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
