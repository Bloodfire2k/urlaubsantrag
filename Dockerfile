# Multi-stage build für optimale Performance
FROM node:18-alpine AS builder

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package files kopieren
COPY package*.json ./
COPY prisma ./prisma/

# Dependencies installieren
RUN npm ci --only=production && npm cache clean --force

# Prisma Client generieren
RUN npx prisma generate

# Source code kopieren
COPY . .

# Frontend build
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Installiere notwendige Tools für Health Checks
RUN apk add --no-cache wget

WORKDIR /app

# Nur production dependencies kopieren
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Server files kopieren
COPY src/server ./src/server
COPY src/lib ./src/lib
COPY src/types ./src/types
COPY src/utils ./src/utils

# Prisma Client kopieren
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Port exposieren
EXPOSE 3000

# Health check mit wget statt curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Server starten
CMD ["npm", "run", "start:prod"]
