FROM node:18-alpine

WORKDIR /usr/src/parse

# Copy package files
COPY package*.json ./

# Install dependencies (skip peer dependency errors)
RUN npm install --production --legacy-peer-deps

# Copy application files
COPY . .

# Expose port
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:1337/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
