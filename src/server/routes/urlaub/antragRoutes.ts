import { Router, Request, Response } from 'express'
import { authenticateToken } from '../../middleware/auth/jwtAuth'
import { requireManagerOrAdmin } from '../../middleware/auth/roleAuth'
import { urlaubService } from '../../services/urlaub/urlaubService'
import { validationService } from '../../services/urlaub/validationService'
import { createAuditLog } from '../../utils/audit/auditLogger'

const router = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Urlaub:
 *       type: object
 *       required:
 *         - id
 *         - mitarbeiterId
 *         - startDatum
 *         - endDatum
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Die ID des Urlaubsantrags
 *         mitarbeiterId:
 *           type: number
 *           description: Die ID des Mitarbeiters
 *         mitarbeiterName:
 *           type: string
 *           description: Der Name des Mitarbeiters
 *         startDatum:
 *           type: string
 *           format: date
 *           description: Das Startdatum des Urlaubs
 *         endDatum:
 *           type: string
 *           format: date
 *           description: Das Enddatum des Urlaubs
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Der Status des Urlaubsantrags
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Der Zeitpunkt der Erstellung
 */

/**
 * @swagger
 * /urlaub:
 *   get:
 *     summary: Alle Urlaubsanträge abrufen
 *     description: Ruft alle Urlaubsanträge ab, gefiltert nach Benutzerrolle und Jahr
 *     tags: [Urlaub]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jahr
 *         schema:
 *           type: integer
 *         description: Das Jahr für die Filterung (optional)
 *     responses:
 *       200:
 *         description: Liste der Urlaubsanträge
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 urlaubAntraege:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Urlaub'
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 *       500:
 *         description: Server-Fehler
 */

// Alle Urlaubsanträge abrufen
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const jahr = req.query.jahr ? parseInt(req.query.jahr as string) : null
    const urlaube = urlaubService.getAllUrlaube(
      req.user.userId,
      req.user.role,
      req.user.marketId,
      jahr
    )

    res.json({
      success: true,
      urlaubAntraege: urlaube
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Urlaubsanträge:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Urlaubsanträge' 
    })
  }
})

// Urlaubsantrag nach ID abrufen
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const antragId = parseInt(req.params.id)
    const antrag = urlaubService.getUrlaubById(antragId)
    
    if (!antrag) {
      return res.status(404).json({ error: 'Urlaubsantrag nicht gefunden' })
    }

    if (!urlaubService.canAccessUrlaub(req.user.userId, req.user.role, req.user.marketId, antrag)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
    }

    res.json({
      success: true,
      urlaubAntrag: antrag
    })
  } catch (error) {
    console.error('Fehler beim Abrufen des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Urlaubsantrags' 
    })
  }
})

/**
 * @swagger
 * /urlaub:
 *   post:
 *     summary: Neuen Urlaubsantrag erstellen
 *     description: Erstellt einen neuen Urlaubsantrag für den authentifizierten Benutzer
 *     tags: [Urlaub]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_datum
 *               - end_datum
 *             properties:
 *               start_datum:
 *                 type: string
 *                 format: date
 *                 description: Das Startdatum des Urlaubs
 *               end_datum:
 *                 type: string
 *                 format: date
 *                 description: Das Enddatum des Urlaubs
 *               bemerkung:
 *                 type: string
 *                 description: Optionale Bemerkung zum Urlaubsantrag
 *     responses:
 *       201:
 *         description: Urlaubsantrag erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 urlaubAntrag:
 *                   $ref: '#/components/schemas/Urlaub'
 *       400:
 *         description: Validierungsfehler
 *       401:
 *         description: Nicht authentifiziert
 *       500:
 *         description: Server-Fehler
 */
// Neuen Urlaubsantrag erstellen
router.post('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const { start_datum, end_datum, bemerkung } = req.body

    // Validierung
    if (!start_datum || !end_datum) {
      return res.status(400).json({ 
        error: 'Start- und Enddatum sind erforderlich' 
      })
    }

    const validation = validationService.validateUrlaubAntrag(
      start_datum,
      end_datum,
      req.user.userId
    )

    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.errors.join(', ') 
      })
    }

    // Urlaubsantrag erstellen
    const newAntrag = urlaubService.createUrlaub(
      req.user.userId,
      start_datum,
      end_datum,
      bemerkung
    )

    // Audit-Log erstellen
    createAuditLog(
      req,
      'CREATE_URLAUB_ANTRAG',
      'urlaub_antraege',
      newAntrag.id,
      null,
      newAntrag
    )

    res.status(201).json({
      success: true,
      message: 'Urlaubsantrag erfolgreich erstellt',
      urlaubAntrag: newAntrag
    })
  } catch (error) {
    console.error('Fehler beim Erstellen des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Erstellen des Urlaubsantrags' 
    })
  }
})

// Urlaubsantrag genehmigen/ablehnen
router.put('/:id/status', authenticateToken, (req: Request, res: Response) => {
  try {
    const antragId = req.params.id
    const { status, bemerkung } = req.body

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status muss "approved", "rejected" oder "pending" sein' 
      })
    }

    const antrag = urlaubService.getUrlaubById(antragId)
    if (!antrag) {
      return res.status(404).json({ error: 'Urlaubsantrag nicht gefunden' })
    }

    if (!urlaubService.canAccessUrlaub(req.user.userId, req.user.role, req.user.marketId, antrag)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
    }

    const updatedAntrag = urlaubService.updateUrlaubStatus(
      antragId,
      status as 'approved' | 'rejected' | 'pending',
      req.user.userId
    )

    // Audit-Log erstellen
    createAuditLog(
      req,
      `UPDATE_URLAUB_STATUS_${status.toUpperCase()}`,
      'urlaub_antraege',
      antragId,
      antrag,
      updatedAntrag
    )

    res.json({
      success: true,
      message: `Urlaubsantrag erfolgreich ${status === 'approved' ? 'genehmigt' : 'abgelehnt'}`,
      urlaubAntrag: updatedAntrag
    })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Aktualisieren des Urlaubsantrags' 
    })
  }
})

// Urlaubsantrag löschen
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const antragId = parseInt(req.params.id)
    const antrag = urlaubService.getUrlaubById(antragId)
    
    if (!antrag) {
      return res.status(404).json({ error: 'Urlaubsantrag nicht gefunden' })
    }

    if (!urlaubService.canAccessUrlaub(req.user.userId, req.user.role, req.user.marketId, antrag)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
    }

    // Erlaube das Löschen von pending und rejected Anträgen
    if (antrag.status === 'approved') {
      return res.status(400).json({ 
        error: 'Genehmigte Anträge können nicht gelöscht werden' 
      })
    }

    const deleted = urlaubService.deleteUrlaub(antragId)
    if (!deleted) {
      return res.status(500).json({ error: 'Fehler beim Löschen des Urlaubsantrags' })
    }

    // Audit-Log erstellen
    createAuditLog(
      req,
      'DELETE_URLAUB_ANTRAG',
      'urlaub_antraege',
      antragId,
      antrag,
      null
    )

    res.json({
      success: true,
      message: 'Urlaubsantrag erfolgreich gelöscht'
    })
  } catch (error) {
    console.error('Fehler beim Löschen des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Löschen des Urlaubsantrags' 
    })
  }
})

export { router as antragRoutes }
