# 🚀 Coolify Deployment Anleitung

## Übersicht
Diese Anleitung erklärt, wie Sie das Urlaubsantrag-System auf Ihrem Coolify-Server deployen können.

## 📋 Voraussetzungen
- Coolify-Server läuft und ist erreichbar
- Docker ist auf dem Server installiert
- Git-Repository ist auf GitHub verfügbar

## 🔧 Deployment-Schritte

### 1. Repository in Coolify hinzufügen
1. Öffnen Sie Ihr Coolify-Dashboard
2. Klicken Sie auf "New Resource" → "Application"
3. Wählen Sie "GitHub" als Quelle
4. Wählen Sie das Repository: `Bloodfire2k/urlaubsantrag`
5. Wählen Sie den Branch: `main`

### 2. Build-Konfiguration
```
Build Command: npm run build
Start Command: npm run start
Port: 3000
```

### 3. Umgebungsvariablen setzen
Fügen Sie folgende Umgebungsvariablen in Coolify hinzu:

#### Für SQLite (einfach):
```
NODE_ENV=production
DB_TYPE=sqlite
DATABASE_URL=file:/app/data/production.db
JWT_SECRET=ihr-super-geheimer-jwt-schluessel-2024-production
PORT=3000
```

#### Für PostgreSQL (empfohlen):
```
NODE_ENV=production
DB_TYPE=postgresql
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=ihr-super-geheimer-jwt-schluessel-2024-production
PORT=3000
```

### 4. Datenbank einrichten

#### Option A: SQLite (einfach)
- Keine zusätzliche Konfiguration nötig
- Daten werden im Container gespeichert
- **Nachteil**: Daten gehen verloren bei Container-Neustart

#### Option B: PostgreSQL (empfohlen)
1. Erstellen Sie eine PostgreSQL-Datenbank in Coolify
2. Führen Sie die Prisma-Migrationen aus:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### 5. Deployment starten
1. Klicken Sie auf "Deploy"
2. Warten Sie, bis der Build abgeschlossen ist
3. Überprüfen Sie die Logs auf Fehler

## 🔍 Troubleshooting

### Häufige Probleme:

#### 1. Build-Fehler
- Überprüfen Sie, ob alle Dependencies in `package.json` stehen
- Stellen Sie sicher, dass Node.js 18+ verwendet wird

#### 2. Datenbank-Verbindungsfehler
- Überprüfen Sie die `DATABASE_URL`
- Stellen Sie sicher, dass die Datenbank läuft
- Überprüfen Sie Firewall-Einstellungen

#### 3. Port-Konflikte
- Stellen Sie sicher, dass Port 3000 frei ist
- Ändern Sie den Port in den Umgebungsvariablen

## 📊 Monitoring

### Health-Check
Die Anwendung hat einen eingebauten Health-Check:
```
GET /api/health
```

### Logs
Überwachen Sie die Logs in Coolify für:
- Datenbankverbindungen
- API-Anfragen
- Fehler

## 🔒 Sicherheit

### Wichtige Sicherheitseinstellungen:
1. **JWT_SECRET**: Verwenden Sie einen starken, zufälligen Schlüssel
2. **CORS**: Konfigurieren Sie CORS für Ihre Domain
3. **HTTPS**: Aktivieren Sie HTTPS in Coolify
4. **Firewall**: Beschränken Sie den Zugriff auf den Server

## 📈 Skalierung

### Für höhere Lasten:
1. **Mehrere Instanzen**: Konfigurieren Sie mehrere Container
2. **Load Balancer**: Verwenden Sie einen Load Balancer
3. **Datenbank**: Verwenden Sie PostgreSQL statt SQLite
4. **Caching**: Implementieren Sie Redis-Caching

## 🔄 Updates

### Automatische Updates:
1. Aktivieren Sie "Auto Deploy" in Coolify
2. Bei jedem Push auf `main` wird automatisch neu deployed
3. Überprüfen Sie die Logs nach dem Update

## 📞 Support

Bei Problemen:
1. Überprüfen Sie die Coolify-Logs
2. Schauen Sie in die Anwendungs-Logs
3. Überprüfen Sie die Umgebungsvariablen
4. Testen Sie die Datenbankverbindung

---

**Viel Erfolg beim Deployment! 🎉**
