# Directory Overview

Erstellt am: 15.08.2024, 11:52 Uhr

Ausgeschlossene Ordner:
- node_modules/
- .git/
- .idea/
- .vscode/
- build/
- dist/
- coverage/
- .cache/
- target/
- .gradle/

```text
📁 Urlaubsantrag Mitarbeiter/
├── 📁 data/                          # JSON-Datenbank
│   ├── audit_logs.json              (12 KB)
│   ├── markets.json                 (2 KB)
│   ├── urlaub_antraege.json        (15 KB)
│   ├── urlaub_budgets.json         (8 KB)
│   └── users.json                   (5 KB)
├── 📁 prisma/                        # Datenbank-Migration
│   ├── dev.db                       (128 KB)
│   ├── 📁 migrations/
│   │   └── 20250814212624_init/
│   │       └── migration.sql        (3 KB)
│   └── schema.prisma                (2 KB)
├── 📁 scripts/                       # Build & Setup Scripts
│   ├── create-demo-data.ts         (4 KB)
│   ├── docker-startup.sh           (1 KB)
│   ├── import-json.ts              (3 KB)
│   ├── seed-db.ts                  (2 KB)
│   └── test-db.ts                  (1 KB)
├── 📁 src/                           # Source Code
│   ├── 📁 components/                # React Components
│   │   ├── 📁 admin/
│   │   │   ├── 📁 overview/         # Admin Übersicht
│   │   │   │   ├── AdminUrlaubsUebersichtInline.tsx (80 KB)
│   │   │   │   ├── EmployeeDetails.tsx             (120 KB)
│   │   │   │   ├── EmployeeList.tsx                (150 KB)
│   │   │   │   ├── OverviewFilters.tsx             (80 KB)
│   │   │   │   └── OverviewStats.tsx               (50 KB)
│   │   │   └── 📁 user/             # Benutzerverwaltung
│   │   │       ├── UserForm.tsx                    (200 KB)
│   │   │       ├── UserList.tsx                    (350 KB)
│   │   │       ├── UserModal.tsx                   (80 KB)
│   │   │       └── UserStatusBadge.tsx             (40 KB)
│   │   ├── 📁 error/                # Error Boundaries
│   │   │   ├── ComponentErrorBoundary.tsx          (30 KB)
│   │   │   ├── ErrorBoundary.tsx                   (50 KB)
│   │   │   └── RouteErrorBoundary.tsx              (25 KB)
│   │   ├── 📁 ui/                   # UI Components
│   │   │   ├── Badge.tsx                           (15 KB)
│   │   │   ├── Button.test.tsx                     (20 KB)
│   │   │   ├── Button.tsx                          (25 KB)
│   │   │   └── Card.tsx                            (18 KB)
│   │   └── 📁 vacation/             # Urlaubs-Komponenten
│   │       ├── NoEmployeesFound.tsx                (30 KB)
│   │       ├── Pruefung.tsx                        (120 KB)
│   │       ├── VacationCalendar.tsx                (200 KB)
│   │       └── VacationFilters.tsx                 (80 KB)
│   ├── 📁 contexts/                  # React Contexts
│   │   ├── AuthContext.tsx                         (45 KB)
│   │   └── YearContext.tsx                         (25 KB)
│   ├── 📁 hooks/                     # Custom Hooks
│   │   ├── 📁 admin/
│   │   │   ├── useOverviewData.test.ts            (35 KB)
│   │   │   ├── useOverviewData.ts                 (120 KB)
│   │   │   └── useUserManagement.ts               (250 KB)
│   │   └── 📁 vacation/
│   │       ├── useVacationCalendar.ts             (150 KB)
│   │       └── useVacationData.ts                 (80 KB)
│   ├── 📁 server/                    # Backend
│   │   ├── 📁 config/               # Server Config
│   │   │   ├── app.ts                             (40 KB)
│   │   │   ├── cors.ts                            (15 KB)
│   │   │   ├── security.ts                        (20 KB)
│   │   │   └── swagger.ts                         (30 KB)
│   │   ├── 📁 middleware/           # Express Middleware
│   │   │   ├── 📁 auth/
│   │   │   │   ├── jwtAuth.ts                     (30 KB)
│   │   │   │   └── roleAuth.ts                    (15 KB)
│   │   │   ├── errorHandler.ts                    (10 KB)
│   │   │   └── notFoundHandler.ts                 (5 KB)
│   │   ├── 📁 routes/               # API Routes
│   │   │   ├── 📁 urlaub/
│   │   │   │   ├── antragRoutes.test.ts          (200 KB)
│   │   │   │   ├── antragRoutes.ts               (150 KB)
│   │   │   │   ├── budgetRoutes.test.ts          (100 KB)
│   │   │   │   ├── budgetRoutes.ts               (80 KB)
│   │   │   │   └── index.ts                       (10 KB)
│   │   │   ├── auth.ts                            (45 KB)
│   │   │   ├── markets.ts                         (35 KB)
│   │   │   └── users.ts                           (55 KB)
│   │   ├── 📁 services/             # Business Logic
│   │   │   └── 📁 urlaub/
│   │   │       ├── budgetService.ts               (50 KB)
│   │   │       ├── urlaubService.ts               (120 KB)
│   │   │       └── validationService.ts           (70 KB)
│   │   └── 📁 utils/                # Server Utils
│   │       ├── 📁 audit/
│   │       │   └── auditLogger.ts                 (30 KB)
│   │       ├── healthCheck.ts                     (15 KB)
│   │       └── shutdown.ts                        (10 KB)
│   ├── 📁 services/                  # Frontend Services
│   │   ├── 📁 admin/
│   │   │   ├── overviewService.test.ts           (35 KB)
│   │   │   ├── overviewService.ts                (150 KB)
│   │   │   └── userService.ts                    (180 KB)
│   │   └── 📁 vacation/
│   │       └── vacationService.ts                (100 KB)
│   ├── 📁 types/                     # TypeScript Types
│   │   ├── 📁 admin/
│   │   │   ├── overview.ts                       (40 KB)
│   │   │   └── user.ts                           (50 KB)
│   │   ├── 📁 vacation/
│   │   │   └── index.ts                          (30 KB)
│   │   ├── auth.ts                               (25 KB)
│   │   └── urlaub.ts                             (35 KB)
│   └── 📁 utils/                     # Frontend Utils
│       ├── vacationBlocks.ts                     (45 KB)
│       └── vacationCalculator.ts                 (35 KB)
├── App.tsx                                       (85 KB)
├── index.html                                    (2 KB)
├── package.json                                  (3 KB)
├── tailwind.config.js                           (2 KB)
├── tsconfig.json                                (1 KB)
└── vite.config.ts                               (1 KB)
```

## Top 20 größte Source-Dateien

| Pfad | KB | Zeilen |
|------|-----|--------|
| src/components/admin/user/UserList.tsx | 350 | 1321 |
| src/hooks/admin/useUserManagement.ts | 250 | 850 |
| src/components/vacation/VacationCalendar.tsx | 200 | 750 |
| src/server/routes/urlaub/antragRoutes.test.ts | 200 | 720 |
| src/components/admin/user/UserForm.tsx | 200 | 680 |
| src/services/admin/userService.ts | 180 | 620 |
| src/components/admin/overview/EmployeeList.tsx | 150 | 580 |
| src/services/admin/overviewService.ts | 150 | 550 |
| src/server/routes/urlaub/antragRoutes.ts | 150 | 520 |
| src/hooks/vacation/useVacationCalendar.ts | 150 | 510 |
| src/components/admin/overview/EmployeeDetails.tsx | 120 | 450 |
| src/hooks/admin/useOverviewData.ts | 120 | 440 |
| src/server/services/urlaub/urlaubService.ts | 120 | 430 |
| src/components/vacation/Pruefung.tsx | 120 | 420 |
| src/services/vacation/vacationService.ts | 100 | 380 |
| src/server/routes/urlaub/budgetRoutes.test.ts | 100 | 360 |
| src/App.tsx | 85 | 320 |
| src/components/admin/overview/OverviewFilters.tsx | 80 | 300 |
| src/server/routes/urlaub/budgetRoutes.ts | 80 | 290 |
| src/components/admin/user/UserModal.tsx | 80 | 280 |
