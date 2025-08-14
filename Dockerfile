# Änderung: Multi-Stage Dockerfile für optimalen Build
# Grund: Schnellere Builds, kleinere Production Images, bessere Caching

# =============================================================================
# BUILD STAGE - Alle Dependencies und Build-Prozesse
# =============================================================================
FROM node:20-alpine AS builder

# Arbeitsverzeichnis setzen
WORKDIR /app

# System-Dependencies für native Module installieren
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Package files zuerst kopieren für besseres Caching
COPY package*.json ./
COPY prisma/ ./prisma/

# Dependencies installieren (mit Cache-Optimierung)
RUN npm ci --only=production --no-audit --no-fund && \
    npm ci --only=development --no-audit --no-fund

# Prisma Client generieren
RUN npx prisma generate

# Gesamten Source Code kopieren
COPY . .

# TypeScript und Vite Build
RUN npm run build

# =============================================================================
# PRODUCTION STAGE - Nur Runtime Dependencies
# =============================================================================
FROM node:20-alpine AS production

# Änderung: Notwendige Tools für Health Checks und SQLite
# Grund: Alpine braucht wget für Health Checks, sqlite für Datenbank
RUN apk add --no-cache \
    wget \
    sqlite \
    dumb-init

# Non-root User erstellen
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Arbeitsverzeichnis setzen
WORKDIR /app

# Production dependencies kopieren
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Prisma Schema und Client kopieren
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Build Outputs kopieren
COPY --from=builder /app/dist ./dist

# Server Source Files kopieren (für tsx)
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/src/utils ./src/utils

# Import Script und Startup Script kopieren
COPY --from=builder /app/scripts/import-json.ts ./scripts/
COPY --from=builder /app/scripts/docker-startup.sh ./scripts/
RUN chmod +x ./scripts/docker-startup.sh

# SQLite Datenbank-Verzeichnis erstellen
RUN mkdir -p /app/data && \
    chown -R nextjs:nodejs /app

# User wechseln
USER nextjs

# Umgebungsvariablen
ENV NODE_ENV=production
ENV PORT=3000

# Port exposieren
EXPOSE 3000

# Änderung: Health Check mit wget (Alpine-kompatibel)
# Grund: curl ist nicht standardmäßig in Alpine verfügbar
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Änderung: dumb-init für besseres Signal Handling in Containern
# Grund: Verhindert Zombie-Prozesse und ermöglicht graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Änderung: Startup Script verwenden für DB-Setup
# Grund: Automatische Migration und Demo-Daten beim Container-Start
CMD ["./scripts/docker-startup.sh"]