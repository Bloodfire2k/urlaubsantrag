import { Router } from 'express'
import { db } from '../database'

const router = Router()

router.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: db.isConnected() ? 'connected' : 'disconnected'
  })
})

export const healthCheckRoute = router
