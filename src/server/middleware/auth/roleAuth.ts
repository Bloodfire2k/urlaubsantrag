import { Request, Response, NextFunction } from 'express'

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' })
  }
  next()
}

export const requireManagerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Manager- oder Admin-Berechtigung erforderlich' })
  }
  next()
}
