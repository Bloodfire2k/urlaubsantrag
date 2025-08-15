import { Request, Response, NextFunction } from 'express'

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err)
  res.status(500).json({ 
    error: 'Interner Server-Fehler',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Etwas ist schiefgelaufen'
  })
}
