import express from 'express'
import { corsConfig } from './cors'
import { helmetConfig, rateLimiter } from './security'
import { errorHandler } from '../middleware/errorHandler'
import { notFoundHandler } from '../middleware/notFoundHandler'
import { authRoutes } from '../routes/auth'
import { userRoutes } from '../routes/users'
import { urlaubRoutes } from '../routes/urlaub'
import { marktRoutes } from '../routes/markets'
import { healthCheckRoute } from '../utils/healthCheck'

export const createApp = () => {
  const app = express()

  // Sicherheits-Middleware
  app.use(helmetConfig)
  app.use(corsConfig)
  app.use('/api/', rateLimiter)

  // Body Parser
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // API Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/urlaub', urlaubRoutes)
  app.use('/api/markets', marktRoutes)
  app.use('/api/health', healthCheckRoute)

  // Error Handling
  app.use(errorHandler)
  app.use('*', notFoundHandler)

  return app
}
