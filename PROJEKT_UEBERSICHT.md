# Urlaubsantrag Mitarbeiter - Projektübersicht

## Architektur

### Frontend

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS + DaisyUI
- **State Management:** Context API (AuthContext, YearContext)
- **Komponenten:**
  - `ui/`: Wiederverwendbare UI-Komponenten
  - `admin/`: Admin-spezifische Komponenten
  - `vacation/`: Urlaubs-spezifische Komponenten
  - `error/`: Error Boundaries und Fehlerbehandlung

### Backend

- **Framework:** Express.js + TypeScript
- **Datenbank:** JSON-basiert (mit Migration zu SQLite geplant)
- **Authentifizierung:** JWT-Token
- **API-Dokumentation:** OpenAPI/Swagger
- **Struktur:**
  - `config/`: App-Konfiguration
  - `middleware/`: Express Middleware
  - `routes/`: API-Routen
  - `services/`: Business-Logik
  - `utils/`: Hilfsfunktionen

## Ordnerstruktur

```
src/
├── components/
│   ├── ui/           # Basis-UI-Komponenten
│   ├── admin/        # Admin-Komponenten
│   ├── vacation/     # Urlaubs-Komponenten
│   └── error/        # Error Boundaries
├── contexts/         # React Context Provider
├── hooks/           # Custom React Hooks
├── services/        # API-Service-Layer
├── types/           # TypeScript Interfaces
├── utils/           # Hilfsfunktionen
└── server/          # Backend-Code
    ├── config/      # Server-Konfiguration
    ├── middleware/  # Express Middleware
    ├── routes/      # API-Routen
    ├── services/    # Business-Logik
    └── utils/       # Server-Utilities
```

## Namenskonventionen

- **Komponenten:** PascalCase (z.B. `UrlaubForm.tsx`)
- **Hooks:** camelCase mit use-Prefix (z.B. `useAuth.ts`)
- **Services:** camelCase (z.B. `urlaubService.ts`)
- **Types:** PascalCase (z.B. `UrlaubAntrag.ts`)
- **API-Routen:** kebab-case (z.B. `/api/urlaub-antrag`)

## Öffentliche Schnittstellen

### User Interface

```typescript
interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'employee'
  market_id: number
  department?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### Urlaub Interface

```typescript
interface Urlaub {
  id: string
  mitarbeiterId: number
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
```

## Testing

- **Frontend:** Vitest + React Testing Library
- **Backend:** Vitest + Supertest
- **Coverage:** Istanbul
- **Test-Arten:**
  - Unit Tests (`npm run test:frontend`)
  - Integration Tests (`npm run test:integration`)
  - Backend Tests (`npm run test:backend`)

## Fehlerbehandlung

- **Frontend:**
  - Error Boundaries für React-Komponenten
  - Route-Level Error Boundaries
  - Component-Level Error Boundaries
- **Backend:**
  - Globaler Error Handler
  - Route-spezifische Error Handler
  - Validierung mit detaillierten Fehlermeldungen

## API-Dokumentation

- **URL:** `/api-docs`
- **Framework:** OpenAPI/Swagger
- **Authentifizierung:** Bearer Token
- **Basis-URL:** `http://localhost:3002/api`

## Build & Deployment

- **Development:**
  ```bash
  npm run dev:full      # Frontend + Backend
  npm run dev          # Nur Frontend
  npm run server       # Nur Backend
  ```

- **Production:**
  ```bash
  npm run build       # Frontend + Backend
  npm run start:prod  # Produktions-Server
  ```

- **Docker:**
  ```bash
  npm run docker:build  # Image bauen
  npm run docker:up     # Container starten
  npm run docker:down   # Container stoppen
  ```

## Kritische Regeln

1. Keine Mock-Daten in Produktion
2. Immer deutsche Kommunikation
3. Minimale Änderungen an bestehenden Schnittstellen
4. Sonntag ist der einzige Wochenendtag
5. Alle Änderungen müssen getestet sein
6. Fehlerbehandlung ist obligatorisch
7. API-Dokumentation muss aktuell sein