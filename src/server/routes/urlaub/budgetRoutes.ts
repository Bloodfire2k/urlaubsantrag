import { Router, Request, Response } from 'express'
import { authenticateToken } from '../../middleware/auth/jwtAuth'
import { requireManagerOrAdmin } from '../../middleware/auth/roleAuth'
import { budgetService } from '../../services/urlaub/budgetService'
import { validationService } from '../../services/urlaub/validationService'
import { createAuditLog } from '../../utils/audit/auditLogger'

const router = Router()

// Alle Urlaubsbudgets für ein Jahr abrufen
router.get('/all', authenticateToken, (req: Request, res: Response) => {
  try {
    const jahr = req.query.jahr ? parseInt(req.query.jahr as string) : new Date().getFullYear()
    const budgets = budgetService.getAllBudgets(jahr)
    
    res.json({
      success: true,
      budgets
    })
  } catch (error) {
    console.error('Fehler beim Abrufen aller Urlaubsbudgets:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen aller Urlaubsbudgets' 
    })
  }
})

// Urlaubsanspruch für Jahr setzen (spezifische Route ZUERST)
router.put('/:userId/:year', authenticateToken, requireManagerOrAdmin, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)
    const year = parseInt(req.params.year)
    const { jahresanspruch } = req.body

    if (!budgetService.canAccessBudget(req.user.userId, req.user.role, req.user.marketId, userId)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    const result = budgetService.setAnnualEntitlement(userId, year, Number(jahresanspruch))
    
    res.json({
      success: true,
      message: 'Urlaubsanspruch erfolgreich aktualisiert',
      budget: result
    })
  } catch (error) {
    console.error('Fehler beim Setzen des Urlaubsanspruchs:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Interner Server-Fehler' 
    })
  }
})

// Einzelnes Urlaubsbudget nach Jahr abrufen (spezifische Route)
router.get('/:userId/:year', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)
    const year = parseInt(req.params.year)
    
    if (!budgetService.canAccessBudget(req.user.userId, req.user.role, req.user.marketId, userId)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    const budget = budgetService.getBudget(userId, year)
    if (!budget) {
      return res.status(404).json({ error: 'Kein Urlaubsbudget für das Jahr gefunden' })
    }

    res.json(budget)
  } catch (error) {
    console.error('Fehler beim Abrufen des Urlaubsbudgets:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Urlaubsbudgets' 
    })
  }
})

// Einzelnes Urlaubsbudget abrufen (Legacy - allgemeine Route NACH spezifischen)
router.get('/:userId', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)
    const jahr = req.query.jahr ? parseInt(req.query.jahr as string) : new Date().getFullYear()
    
    if (!budgetService.canAccessBudget(req.user.userId, req.user.role, req.user.marketId, userId)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    // Hole alle Budgets für das Jahr
    const allBudgets = budgetService.getAllBudgets(jahr)
    
    // Finde das Budget für den spezifischen Benutzer
    const budget = allBudgets.find(b => b.mitarbeiter.id === userId)
    
    if (!budget) {
      return res.status(404).json({ error: 'Kein Urlaubsbudget für das aktuelle Jahr gefunden' })
    }

    res.json({
      success: true,
      budget
    })
  } catch (error) {
    console.error('Fehler beim Abrufen des Urlaubsbudgets:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Urlaubsbudgets' 
    })
  }
})

// Urlaubsbudget aktualisieren
router.put('/:userId', authenticateToken, requireManagerOrAdmin, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)
    const { jahresanspruch, uebertrag, jahr } = req.body

    if (!budgetService.canAccessBudget(req.user.userId, req.user.role, req.user.marketId, userId)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    const validation = validationService.validateBudgetUpdate(jahresanspruch, uebertrag)
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.errors.join(', ') 
      })
    }

    const budget = budgetService.getBudget(userId, jahr || new Date().getFullYear())
    if (!budget) {
      return res.status(404).json({ error: 'Kein Urlaubsbudget für das aktuelle Jahr gefunden' })
    }

    const updatedBudget = budgetService.updateBudget(budget.id, {
      jahresanspruch,
      uebertrag
    })

    // Audit-Log erstellen
    createAuditLog(
      req,
      'UPDATE_URLAUB_BUDGET',
      'urlaub_budgets',
      budget.id,
      budget,
      updatedBudget
    )

    res.json({
      success: true,
      message: 'Urlaubsbudget erfolgreich aktualisiert',
      budget: updatedBudget
    })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Urlaubsbudgets:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Aktualisieren des Urlaubsbudgets' 
    })
  }
})

export { router as budgetRoutes }
