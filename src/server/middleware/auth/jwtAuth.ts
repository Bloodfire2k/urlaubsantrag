import { Request, Response, NextFunction } from 'express'
import * as jwt from 'jsonwebtoken'

// Erweitere den Request-Typ um user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        role: string
        marketId?: number
        username: string
      }
    }
  }
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required') })()

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Kein Token bereitgestellt' })
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Ungültiger Token' })
  }
}
