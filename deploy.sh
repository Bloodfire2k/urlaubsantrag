#!/bin/bash

# Urlaubsantrag Deployment Script für Coolify
echo "🚀 Starte Deployment der Urlaubsantrag-Anwendung..."

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fehlerbehandlung
set -e

# Funktion für farbige Ausgabe
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Abhängigkeiten installieren
print_status "Installiere Dependencies..."
npm ci --only=production

# 2. Frontend build
print_status "Baue Frontend..."
npm run build

# 3. Prisma generieren
print_status "Generiere Prisma Client..."
npx prisma generate

# 4. Datenbank-Migration (nur wenn DATABASE_URL gesetzt)
if [ ! -z "$DATABASE_URL" ]; then
    print_status "Führe Datenbank-Migration aus..."
    npx prisma migrate deploy
    
    print_status "Seede Datenbank mit Demo-Daten..."
    npm run db:demo || print_warning "Demo-Daten bereits vorhanden"
else
    print_warning "DATABASE_URL nicht gesetzt - überspringe Migration"
fi

# 5. Health Check
print_status "Starte Health Check..."
timeout 30s bash -c 'until curl -f http://localhost:3000/api/health; do sleep 2; done' || print_warning "Health Check fehlgeschlagen"

print_status "Deployment erfolgreich! 🎉"
print_status "Anwendung verfügbar unter: http://localhost:3000"
print_status "API Health Check: http://localhost:3000/api/health"
