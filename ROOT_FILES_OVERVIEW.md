# Root-Verzeichnis Übersicht - Urlaubsantrag System

## 📁 Projektstruktur

Das Urlaubsantrag-System ist eine moderne Webanwendung mit React/TypeScript-Frontend und Express.js-Backend, die in Coolify mit PostgreSQL-Datenbank läuft.

## 🔧 Konfigurationsdateien

### Package Management
- **`package.json`** - Node.js-Abhängigkeiten und Scripts
- **`package-lock.json`** - Gesperrte Versionen der Abhängigkeiten

### TypeScript & Build
- **`tsconfig.json`** - TypeScript-Konfiguration für das Hauptprojekt
- **`tsconfig.node.json`** - TypeScript-Konfiguration für Node.js-spezifische Dateien
- **`tsconfig.node.tsbuildinfo`** - TypeScript Build-Info-Datei

### Vite & Frontend
- **`vite.config.js`** - Vite-Build-Konfiguration
- **`vite.config.ts`** - TypeScript-Version der Vite-Konfiguration
- **`vite.config.d.ts`** - Vite-Typdefinitionen
- **`index.html`** - Haupt-HTML-Datei für das Frontend

### CSS & Styling
- **`tailwind.config.js`** - TailwindCSS-Konfiguration
- **`postcss.config.js`** - PostCSS-Konfiguration für TailwindCSS
- **`modern-styles.css`** - Zusätzliche CSS-Styles

### Testing
- **`vitest.config.ts`** - Vitest-Testkonfiguration
- **`vitest.integration.config.ts`** - Integrationstest-Konfiguration
- **`vitest.server.config.ts`** - Server-Test-Konfiguration

## 🐳 Docker & Deployment

### Docker-Konfiguration
- **`Dockerfile`** - Docker-Image-Definition
- **`docker-compose.yaml`** - Docker Compose-Konfiguration
- **`docker-compose.yml`** - Alternative Docker Compose-Datei
- **`docker-compose.prod.yml`** - Produktions-Docker Compose-Konfiguration

### Deployment-Scripts
- **`deploy.sh`** - Deployment-Skript
- **`scripts/docker-startup.sh`** - Docker-Startup-Skript

## 🌍 Umgebungsvariablen

### Environment-Konfiguration
- **`env.development`** - Entwicklungs-Umgebungsvariablen
- **`env.local`** - Lokale Umgebungsvariablen
- **`env.production`** - Produktions-Umgebungsvariablen
- **`env.example`** - Beispiel-Umgebungsvariablen
- **`env.production.example`** - Beispiel-Produktions-Umgebungsvariablen

## 🗄️ Datenbank & Prisma

### Prisma-Schema
- **`prisma/schema.prisma`** - Datenbankschema-Definition
- **`prisma/migrations/`** - Datenbank-Migrationen
  - `20250814212624_init/` - Initiale Migration
  - `20250823150000_init_postgres/` - PostgreSQL-Initialisierung
- **`prisma/migration_lock.toml`** - Migration-Lock-Datei

### Daten-Skripte
- **`scripts/create-demo-data.ts`** - Demo-Daten-Erstellung
- **`scripts/import-from-json.ts`** - JSON-Import-Skript
- **`scripts/import-json.ts`** - Alternative JSON-Import-Version
- **`scripts/seed-db.ts`** - Datenbank-Seeding
- **`scripts/test-db.ts`** - Datenbank-Test-Skript

## 📚 Dokumentation

### Projekt-Dokumentation
- **`README.md`** - Haupt-README-Datei
- **`PROJEKT_UEBERSICHT.md`** - Projektübersicht
- **`MODERNISIERUNG_ZUSAMMENFASSUNG.md`** - Zusammenfassung der Modernisierung
- **`REFACTORING_REPORT.md`** - Refactoring-Bericht
- **`DEPLOYMENT.md`** - Deployment-Anleitung
- **`COOLIFY_DEPLOYMENT.md`** - Coolify-spezifische Deployment-Info
- **`DIRECTORY_OVERVIEW.md`** - Verzeichnisübersicht
- **`CONTEXT_SNAPSHOT.md`** - Kontext-Snapshot

## 🎨 Assets

### Bilder & Logos
- **`logo.png`** - Projekt-Logo

## 🔍 Git & Versionierung

### Git-Status
- **`h origin main`** - Git-Branch-Information
- **`tatus --short`** - Git-Status (abgekürzt)

## 📋 Wichtige Hinweise

### Technologie-Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + DaisyUI
- **Backend**: Express.js + Prisma + PostgreSQL
- **Deployment**: Coolify mit Docker
- **Testing**: Vitest

### Ports
- **Frontend**: Port 3000
- **Backend**: Port 3002

### Benutzerrollen
- **admin**: Vollzugriff auf alle Funktionen
- **manager**: Zugriff auf Markt-spezifische Daten
- **employee**: Zugriff nur auf eigene Daten

### Datenhaltung
- **Aktuell**: PostgreSQL über Prisma
- **Vorgänger**: JSON-Dateien (Migration abgeschlossen)

## 🚀 Schnellstart

1. **Umgebungsvariablen setzen**: `.env.local` oder `.env.development` kopieren
2. **Abhängigkeiten installieren**: `npm install`
3. **Datenbank starten**: `docker-compose up -d`
4. **Entwicklungsserver starten**: `npm run dev`
5. **Tests ausführen**: `npm test`

## 📝 Wartung

- **Logs überwachen**: Server-Logs auf Prisma-Select-Fehler prüfen
- **API-Responses**: `/api/users` sollte immer `{items, total}` Format liefern
- **Budget**: Standardmäßig 25 Tage pro Mitarbeiter
- **Healthcheck**: `/api/users/healthz` sollte `{ok: true}` zurückgeben

---

*Letzte Aktualisierung: $(date)*
*Projekt: Urlaubsantrag Mitarbeiter System*
*Version: Production Ready mit PostgreSQL*
