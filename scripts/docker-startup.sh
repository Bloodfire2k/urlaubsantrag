#!/bin/sh

# Änderung: Docker Startup Script für automatische DB-Setup
# Grund: Datenbank-Migration und Demo-Daten beim Container-Start

echo "🚀 Starte Urlaubsantrag Container..."

# Warten auf SQLite-Datei-System
echo "📁 Erstelle Datenbank-Verzeichnis..."
mkdir -p /app/data

# Prisma Migration ausführen
echo "🔄 Führe Datenbank-Migration aus..."
npx prisma migrate deploy

# Prüfen ob Datenbank bereits Daten hat
echo "🔍 Prüfe Datenbank-Status..."
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM users;" | tail -1 | grep -o '[0-9]*' || echo "0")

if [ "$USER_COUNT" = "0" ]; then
    echo "📊 Keine Daten gefunden, lade Demo-Daten..."
    
    # Demo-Daten aus JSON importieren
    if [ -f "/app/scripts/import-json.ts" ]; then
        echo "📥 Importiere Daten aus JSON..."
        npx tsx /app/scripts/import-json.ts
    else
        echo "⚠️  Kein Import-Script gefunden, erstelle Basis-Admin..."
        npx prisma db execute --stdin <<< "
        INSERT OR IGNORE INTO markets (id, name, address, phone, email) VALUES 
        (1, 'Edeka Hauptmarkt', 'Hauptstraße 1', '0123456789', 'info@edeka-hauptmarkt.de'),
        (2, 'E-Center', 'Zentrumsplatz 5', '0123456790', 'info@e-center.de');
        
        INSERT OR IGNORE INTO users (id, username, email, full_name, password_hash, role, market_id, department, is_active) VALUES 
        (1, 'admin', 'admin@urlaubsantrag.de', 'Administrator', '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, 'Markt', true);
        "
    fi
else
    echo "✅ Datenbank bereits initialisiert ($USER_COUNT Benutzer gefunden)"
fi

echo "🎯 Starte Production Server..."
exec npm run start:prod
