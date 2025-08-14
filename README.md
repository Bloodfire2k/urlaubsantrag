# 🏖️ Urlaubsantrag System

Eine moderne Webanwendung zur Verwaltung von Mitarbeiter-Urlaubsanträgen mit schöner Benutzeroberfläche.

## ✨ Features

- **Moderne Benutzeroberfläche** mit responsivem Design
- **Von-Bis-Datum-Eingabe** für Urlaubszeiträume
- **Mehrere Wochen eintragbar** mit intelligenter Dauerberechnung
- **Übersichtliche Darstellung** aller Urlaubsanträge
- **Statistiken** über Urlaube und Urlaubstage
- **Validierung** der Eingaben
- **Lokale Speicherung** der Daten
- **Responsive Design** für alle Geräte

## 🚀 Installation

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

3. **Anwendung öffnen:**
   Die Anwendung öffnet sich automatisch unter `http://localhost:3000`

## 🛠️ Build für Produktion

```bash
npm run build
```

## 📱 Verwendung

1. **Urlaubsantrag erstellen:**
   - Klicken Sie auf "Neuen Urlaubsantrag erstellen"
   - Füllen Sie alle Pflichtfelder aus
   - Wählen Sie Start- und Enddatum
   - Optional: Fügen Sie eine Bemerkung hinzu

2. **Urlaube verwalten:**
   - Alle Urlaube werden übersichtlich angezeigt
   - Status wird automatisch berechnet (Geplant/Aktiv/Beendet)
   - Urlaube können gelöscht werden

3. **Statistiken einsehen:**
   - Gesamtanzahl der Urlaube
   - Gesamte Urlaubstage
   - Aktuell im Urlaub befindliche Mitarbeiter

## 🔧 Technologien

- **React 18** mit TypeScript
- **Vite** als Build-Tool
- **date-fns** für Datumsberechnungen
- **Lucide React** für Icons
- **CSS Grid & Flexbox** für Layout
- **LocalStorage** für Datenspeicherung

## 📋 Nächste Schritte

- [ ] **Nextcloud Integration** für Excel-Export
- [ ] **Benutzerverwaltung** mit Login-System
- [ ] **Urlaubsgenehmigung** Workflow
- [ ] **E-Mail-Benachrichtigungen**
- [ ] **Kalenderansicht** der Urlaube
- [ ] **Datenbank-Integration**

## 🎨 Design-Features

- **Moderne Farbpalette** mit Gradienten
- **Schatten und Rundungen** für Tiefe
- **Responsive Grid-Layout** für alle Bildschirmgrößen
- **Smooth Transitions** und Hover-Effekte
- **Deutsche Lokalisierung** für Datumsformate

## 📊 Datenstruktur

```typescript
interface Urlaub {
  id: string
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  bemerkung?: string
  createdAt: string
}
```

## 🤝 Beitragen

Fühlen Sie sich frei, Verbesserungsvorschläge zu machen oder neue Features zu entwickeln!

---

**Entwickelt für moderne Unternehmen** 🚀
