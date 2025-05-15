FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the server code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the API port
EXPOSE 8000

# Command to run the application
CMD ["node", "dist/index.js"]
