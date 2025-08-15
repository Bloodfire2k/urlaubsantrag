import { Router } from 'express'
import { antragRoutes } from './antragRoutes'
import { budgetRoutes } from './budgetRoutes'

const router = Router()

// Urlaubsantrags-Routen
router.use('/', antragRoutes)

// Budget-Routen
router.use('/budget', budgetRoutes)

export { router as urlaubRoutes }
