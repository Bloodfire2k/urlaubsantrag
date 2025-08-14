# Urlaubsantrag Mitarbeiter - Projektübersicht

## Projektzweck und Zielgruppe

**Zweck:** Vollständige Webanwendung zur Urlaubsverwaltung für Mitarbeiter und Administratoren in Einzelhandelsmärkten (Edeka, E-Center).

**Zielgruppe:**
- **Mitarbeiter:** Können Urlaubsanträge stellen, eigene Urlaubsbilanz einsehen
- **Administratoren:** Verwalten Mitarbeiter, überprüfen Anträge, planen Urlaubsverteilung

**Hauptfunktionen:**
- Urlaubsantrag-Erstellung und -verwaltung
- Urlaubsbilanz-Anzeige mit Resturlaub-Berechnung
- Admin-Dashboard mit Mitarbeiterübersicht und Statistiken
- **Neue Prüfungsansicht:** Interaktive Kalenderübersicht zur Urlaubsplanung nach Markt/Abteilung

## Kerntechnologien

**Frontend:**
- React 18 + TypeScript
- Vite (Build-Tool)
- TailwindCSS + DaisyUI (Styling)
- Lucide-React (Icons)

**Backend:**
- Express.js + TypeScript
- JSON-basierte Datenhaltung (keine echte Datenbank)
- JWT-Token Authentifizierung
- Bcrypt für Passwort-Hashing
- Express-rate-limit für API-Schutz

**Entwicklung:**
- Concurrently für parallele Frontend/Backend-Entwicklung
- TSX für TypeScript-Ausführung

## Datei-/Ordnerstruktur

```
src/
├── components/           # React-Komponenten
│   ├── ui/              # Wiederverwendbare UI-Komponenten
│   ├── LoginForm.tsx    # Anmeldung
│   ├── UrlaubForm.tsx   # Urlaubsantrag-Formular
│   ├── UrlaubList.tsx   # Urlaubsanträge-Liste
│   ├── UrlaubBilanz.tsx # Urlaubsbilanz-Anzeige
│   ├── AdminMitarbeiterVerwaltung.tsx  # Admin-Mitarbeiterübersicht
│   ├── AdminUrlaubsUebersichtInline.tsx # Admin-Statistiken
│   └── Pruefung.tsx     # NEUE: Kalender-Urlaubsplanung
├── contexts/            # React Context
│   ├── AuthContext.tsx  # Authentifizierung (token, user)
│   └── YearContext.tsx  # Jahr-Auswahl (selectedYear)
├── server/              # Backend
│   ├── index.ts         # Express-Server
│   └── routes/          # API-Routen
├── types/               # TypeScript-Definitionen
└── utils/               # Hilfsfunktionen

data/                    # JSON-"Datenbank"
├── users.json          # Benutzer mit Passwort-Hashes
├── markets.json        # Märkte (Edeka, E-Center)
├── urlaub_antraege.json # Urlaubsanträge
└── urlaub_budgets.json  # Urlaubskontingente
```

## Hauptkomponenten und Interaktionen

**Authentifizierung:**
- `AuthContext` verwaltet JWT-Token und Benutzerinformationen
- `LoginForm` authentifiziert gegen `/api/auth/login`
- Token wird in localStorage gespeichert

**Urlaubsverwaltung:**
- `UrlaubForm`: Erstellt neue Anträge via `/api/urlaub`
- `UrlaubList`: Zeigt persönliche Anträge an
- `UrlaubBilanz`: Berechnet Resturlaub basierend auf Kontingent und Anträgen

**Admin-Funktionen:**
- `AdminMitarbeiterVerwaltung`: Mitarbeiterliste mit Status-Filtern
- `AdminUrlaubsUebersichtInline`: Statistiken und Mitarbeiter-Urlaubsstatus
- **Status-Indikatoren:** Grün (vollständig), Orange (teilweise), Rot (nicht eingereicht)

**Neue Prüfungsansicht (`Pruefung.tsx`):**
- Markt- und Abteilungs-Auswahl (Markt, Bäckerei, Metzgerei, Kasse)
- Monatskalender mit Urlaubstagen (grün), Feiertagen, Wochenenden (nur Sonntag)
- Mitarbeiter ein-/ausblendbar
- Lädt Daten von `/api/markets`, `/api/users`, `/api/urlaub`

## Aktuelle Bugs und Limitierungen

**Kritische Probleme in Prüfungsansicht:**
- ❌ **Markt-Dropdown nicht funktional** - Märkte werden nicht korrekt aus API geladen/angezeigt
- ❌ **Mitarbeiter-Filter funktioniert nicht** - Keine Mitarbeiter werden nach Markt/Abteilung gefiltert
- ❌ **Abteilungs-Auswahl ohne Funktion** - Dropdown hat keine Wirkung
- ❌ **Datenverknüpfung fehlerhaft** - API-Responses werden nicht korrekt in State übertragen

**Bekannte technische Schulden:**
- JSON-basierte "Datenbank" statt echter Datenbank
- Rate-Limiting musste gelockert werden (1000 Requests/Minute)
- Keine echte Transaktionssicherheit

## Design und UX-Überlegungen

**Responsive Design:**
- Mobile-First Ansatz mit TailwindCSS
- Burger-Menü für mobile Navigation mit Blur-Effekt
- Zentrierte Formulare auf allen Bildschirmgrößen

**Farbkodierung:**
- Grün: Urlaub eingereicht/Urlaubstage
- Orange: Teilweise eingereicht
- Rot: Nicht eingereicht
- Blaue Akzente für interaktive Elemente

**Benutzerfreundlichkeit:**
- Klare Status-Indikatoren mit Icons
- Filter-Buttons mit Mitarbeiter-Anzahl
- Einheitliche Button-Breiten für visueller Konsistenz

## Code-Konventionen

**Naming Patterns:**
- Komponenten: PascalCase (`UrlaubForm.tsx`)
- Funktionen: camelCase (`getUrlaubsStatus`)
- Konstanten: UPPER_SNAKE_CASE (`DEPARTMENTS`)
- API-Routen: kebab-case (`/api/urlaub-antraege`)

**TypeScript-Interfaces:**
```typescript
interface User {
  id: string
  fullName: string
  market_id: string
  department: string
  is_active: boolean
}
```

**Styling-Konventionen:**
- TailwindCSS-Utility-Classes
- Responsive Prefixes: `md:`, `lg:`
- Konsistente Abstände: `p-4`, `mb-8`, `gap-4`
- DaisyUI-Komponenten für komplexe UI-Elemente

**Kommentar-Format:**
```typescript
// Änderung: [Beschreibung]. Grund: [Begründung]
```

## Besondere Anforderungen

**Kritische Regeln:**
1. **Nur echte Daten verwenden** - Keine Placeholder/Fallback-Werte
2. **Produktionsreife Implementierung** - Keine temporären Lösungen
3. **Deutsche Kommunikation** - Alle Erklärungen auf Deutsch
4. **Gezielte Änderungen** - Nur explizit angeforderte Modifikationen
5. **Wochenende nur Sonntag** - Montag-Samstag sind Arbeitstage

**Aktuelle Priorität:**
Die Prüfungsansicht muss vollständig funktionsfähig gemacht werden - alle Dropdowns müssen echte Daten laden und die Filterung muss korrekt arbeiten.
