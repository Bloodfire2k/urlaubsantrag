# 🚀 Urlaubsantrag Server Deployment

## Coolify Deployment

### Voraussetzungen
- Coolify-Server mit Docker
- SSH-Zugang zum Server
- Domain/Subdomain konfiguriert

### 1. Repository auf Server klonen

```bash
# SSH-Verbindung zum Server
ssh user@ihr-server.de

# Repository klonen
git clone <repository-url> urlaubsantrag
cd urlaubsantrag
```

### 2. Umgebungsvariablen konfigurieren

```bash
# .env erstellen
cat > .env << EOF
# Datenbank
DATABASE_URL="postgresql://urlaubsuser:SICHERES_PASSWORT@postgres:5432/urlaubsantrag"
DB_PASSWORD="SICHERES_PASSWORT"

# JWT Secret (32+ Zeichen)
JWT_SECRET="ihr-super-geheimer-jwt-schluessel-production-2024"

# App-Konfiguration
NODE_ENV="production"
PORT="3000"
APP_PORT="3000"

# CORS Origins (Ihre Domain)
ALLOWED_ORIGINS="https://ihr-domain.de,https://www.ihr-domain.de"
EOF
```

### 3. Coolify-Projekt einrichten

1. **In Coolify:**
   - Neues Projekt erstellen
   - Git Repository verbinden
   - Docker Compose Service wählen
   - `.coolify/docker-compose.yml` als Compose-Datei setzen

2. **Umgebungsvariablen in Coolify setzen:**
   ```
   DB_PASSWORD=IhrSicheresPasswort123
   JWT_SECRET=IhrSuperGeheimesJWTSecret2024
   APP_PORT=3000
   ```

### 4. Deployment starten

```bash
# Manuelles Deployment (falls nötig)
chmod +x deploy.sh
./deploy.sh
```

### 5. Erste Anmeldung

Nach erfolgreichem Deployment:

**Admin-Login:**
- URL: `https://ihre-domain.de`
- Username: `admin`
- Passwort: `test`

**Demo-Benutzer:**
- `susanne.asel` / `test` (E-Center, Markt)
- `max.mueller` / `test` (E-Center, Bäckerei)
- `anna.schmidt` / `test` (E-Center, Kasse)
- `peter.wagner` / `test` (Edeka, Metzgerei)
- `lisa.klein` / `test` (Edeka, Markt)

## 🔧 Wartung

### Logs anzeigen
```bash
docker-compose logs -f app
docker-compose logs -f postgres
```

### Datenbank-Backup
```bash
docker-compose exec postgres pg_dump -U urlaubsuser urlaubsantrag > backup.sql
```

### Updates deployieren
```bash
git pull origin main
docker-compose up --build -d
```

## 🛡️ Sicherheit

### SSL/TLS
- Coolify konfiguriert automatisch Let's Encrypt
- HTTPS-Weiterleitung aktivieren

### Firewall
```bash
# Nur notwendige Ports öffnen
ufw allow 22    # SSH
ufw allow 80    # HTTP (für Let's Encrypt)
ufw allow 443   # HTTPS
ufw enable
```

### Passwörter ändern
Nach dem ersten Login alle Demo-Passwörter ändern!

## 📊 Monitoring

### Health Checks
- App: `https://ihre-domain.de/api/health`
- Coolify überwacht automatisch Container-Status

### Metriken
- Coolify Dashboard zeigt CPU, RAM, Disk Usage
- PostgreSQL-Metriken über Coolify verfügbar

## 🐛 Troubleshooting

### Container startet nicht
```bash
docker-compose logs app
docker-compose logs postgres
```

### Datenbank-Verbindungsfehler
1. PostgreSQL-Container-Status prüfen
2. DATABASE_URL-Format validieren
3. Netzwerk-Konnektivität testen

### Frontend lädt nicht
1. Build-Logs prüfen: `npm run build`
2. Static Files im Container vorhanden?
3. Nginx/Reverse Proxy Konfiguration prüfen
