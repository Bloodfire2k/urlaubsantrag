import cors from 'cors'

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://ihre-domain.de']
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3003',
      'http://localhost:5173',
      'http://192.168.2.158:3000',
      'http://192.168.50.212:3001',
      'http://10.5.0.2:3001',
      // Erlaube alle lokalen Netzwerk-IPs für Development
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/
    ]

export const corsConfig = cors({
  origin: allowedOrigins,
  credentials: true
})
