import cors from 'cors'

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://ihre-domain.de']
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3003',
      'http://localhost:5173',
      'http://192.168.2.158:3000'
    ]

export const corsConfig = cors({
  origin: allowedOrigins,
  credentials: true
})
