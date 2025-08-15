# Projekt-Kontext Snapshot

Erstellt am: 15.08.2024, 11:52 Uhr

## Wie benutze ich das?

1. Lade diese Datei + DIRECTORY_OVERVIEW.md in neue Sessions hoch
2. Nutze die "Wichtige Pfade" als Einstiegspunkte für Code-Navigation
3. Beachte die "Refactoring-Highlights" für Architektur-Entscheidungen
4. Prüfe "Nächste Schritte" für anstehende Aufgaben
5. Verwende REFACTORING_REPORT.md für detaillierte Änderungshistorie

## Projektstruktur (Kurz)

- `src/components/`: React-Komponenten (UI, Admin, Vacation)
- `src/contexts/`: React Context Provider (Auth, Year)
- `src/hooks/`: Custom React Hooks (Admin, Vacation)
- `src/services/`: Frontend Services + API-Calls
- `src/types/`: TypeScript Interfaces
- `src/server/`: Backend (Express + TypeScript)
  - `config/`: Server-Konfiguration
  - `middleware/`: Express Middleware
  - `routes/`: API-Routen
  - `services/`: Business-Logik
- `data/`: JSON-Datenbank (Migration zu SQLite geplant)

## Wichtige Pfade

### Frontend
- `src/components/admin/`: Admin-UI-Komponenten
- `src/components/vacation/`: Urlaubs-Komponenten
- `src/components/ui/`: Basis-UI-Komponenten
- `src/hooks/admin/`: Admin-spezifische Hooks
- `src/hooks/vacation/`: Urlaubs-spezifische Hooks
- `src/services/`: API-Service-Layer
- `src/types/`: TypeScript Interfaces

### Backend
- `src/server/routes/`: API-Routen
- `src/server/services/`: Business-Logik
- `src/server/middleware/`: Express Middleware
- `src/server/config/`: Server-Konfiguration

## Refactoring-Highlights

1. **Komponenten-Aufteilung:**
   - Große Komponenten in kleinere Module aufgeteilt
   - Trennung von UI und Business-Logik
   - Wiederverwendbare Services und Hooks

2. **Backend-Struktur:**
   - API-Routen in thematische Module getrennt
   - Zentrale Validierung und Error-Handling
   - OpenAPI/Swagger Dokumentation

3. **Testing & Error Handling:**
   - Frontend Unit Tests (Vitest + RTL)
   - Backend Integration Tests
   - Error Boundaries für React-Komponenten

## Nächste Schritte

1. **Frontend:**
   - Unit Tests für neue Services und Hooks
   - Error Boundary Implementation
   - Loading States & Skeleton UI

2. **Backend:**
   - Integration Tests für neue Services
   - Rate Limiting pro Route
   - Caching-Strategie

3. **Allgemein:**
   - CI/CD Pipeline Setup
   - Monitoring & Logging
   - Performance Optimierung
   - Security Audit

## Top 5 größte Dateien

1. src/components/admin/user/UserList.tsx (350 KB)
2. src/hooks/admin/useUserManagement.ts (250 KB)
3. src/components/vacation/VacationCalendar.tsx (200 KB)
4. src/server/routes/urlaub/antragRoutes.test.ts (200 KB)
5. src/components/admin/user/UserForm.tsx (200 KB)

Vollständige Übersicht siehe DIRECTORY_OVERVIEW.md
Details siehe REFACTORING_REPORT.md
