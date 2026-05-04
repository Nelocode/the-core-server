FROM node:20-slim

WORKDIR /app

# Install system dependencies for Sharp and SQLite
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# Create the prisma data directory (will be overridden by the volume mount)
RUN mkdir -p /app/prisma

EXPOSE 80

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
