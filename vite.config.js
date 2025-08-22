import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Macht Server für alle Netzwerkinterfaces verfügbar
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        },
        watch: {
            ignored: ['**/data/**'] // Verhindert Vite-Reload bei JSON-Datei-Änderungen
        }
    }
});
