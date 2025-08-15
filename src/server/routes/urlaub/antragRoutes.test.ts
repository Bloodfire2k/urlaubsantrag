import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../config/app'
import { createTestUser, createTestUrlaub, generateTestToken } from '../../test/utils'

const app = createApp()

describe('Urlaub Routes', () => {
  let testUser: any
  let testToken: string

  beforeEach(async () => {
    // Test-User erstellen
    testUser = await createTestUser('employee')
    testToken = generateTestToken(testUser)
  })

  describe('GET /urlaub', () => {
    it('gibt 401 zurück ohne Token', async () => {
      const response = await request(app)
        .get('/api/urlaub')
      expect(response.status).toBe(401)
    })

    it('gibt leere Liste zurück ohne Urlaubsanträge', async () => {
      const response = await request(app)
        .get('/api/urlaub')
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.urlaubAntraege).toHaveLength(0)
    })

    it('gibt nur eigene Anträge für normale Mitarbeiter zurück', async () => {
      // Eigener Urlaubsantrag
      await createTestUrlaub(testUser.id)
      
      // Fremder Urlaubsantrag
      await createTestUrlaub(999)

      const response = await request(app)
        .get('/api/urlaub')
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.urlaubAntraege).toHaveLength(1)
      expect(response.body.urlaubAntraege[0].mitarbeiterId).toBe(testUser.id)
    })

    it('filtert nach Jahr', async () => {
      // Urlaubsantrag 2024
      await createTestUrlaub(testUser.id)

      // Urlaubsantrag 2025
      await createTestUrlaub(testUser.id)
      
      const response = await request(app)
        .get('/api/urlaub')
        .query({ jahr: 2024 })
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.urlaubAntraege).toHaveLength(1)
    })
  })

  describe('POST /urlaub', () => {
    it('erstellt einen neuen Urlaubsantrag', async () => {
      const response = await request(app)
        .post('/api/urlaub')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          start_datum: '2024-02-01',
          end_datum: '2024-02-05',
          bemerkung: 'Test Urlaub'
        })
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.urlaubAntrag).toMatchObject({
        mitarbeiterId: testUser.id,
        startDatum: '2024-02-01',
        endDatum: '2024-02-05',
        status: 'pending'
      })
    })

    it('validiert das Startdatum', async () => {
      const response = await request(app)
        .post('/api/urlaub')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          start_datum: '2023-01-01', // Vergangenheit
          end_datum: '2024-01-05'
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Startdatum')
    })

    it('validiert das Enddatum', async () => {
      const response = await request(app)
        .post('/api/urlaub')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          start_datum: '2024-01-05',
          end_datum: '2024-01-01' // Vor Startdatum
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Enddatum')
    })
  })

  describe('PUT /urlaub/:id/status', () => {
    it('erlaubt nur Managern und Admins den Status zu ändern', async () => {
      const urlaub = await createTestUrlaub(999)

      const response = await request(app)
        .put(`/api/urlaub/${urlaub.id}/status`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'approved'
        })
      
      expect(response.status).toBe(403)
    })

    it('genehmigt einen Urlaubsantrag als Manager', async () => {
      const manager = await createTestUser('manager')
      const managerToken = generateTestToken(manager)
      const urlaub = await createTestUrlaub(testUser.id)

      const response = await request(app)
        .put(`/api/urlaub/${urlaub.id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'approved'
        })
      
      expect(response.status).toBe(200)
      expect(response.body.urlaubAntrag.status).toBe('approved')
      expect(response.body.urlaubAntrag.genehmigt_von).toBe(manager.id)
    })
  })

  describe('DELETE /urlaub/:id', () => {
    it('löscht nur eigene ausstehende Anträge', async () => {
      const urlaub = await createTestUrlaub(testUser.id)

      const response = await request(app)
        .delete(`/api/urlaub/${urlaub.id}`)
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('verhindert das Löschen fremder Anträge', async () => {
      const urlaub = await createTestUrlaub(999)

      const response = await request(app)
        .delete(`/api/urlaub/${urlaub.id}`)
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(403)
    })

    it('verhindert das Löschen genehmigter Anträge', async () => {
      const urlaub = await createTestUrlaub(testUser.id)
      urlaub.status = 'approved'
      await db.updateUrlaubAntrag(urlaub.id, urlaub)

      const response = await request(app)
        .delete(`/api/urlaub/${urlaub.id}`)
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(400)
    })
  })
})
