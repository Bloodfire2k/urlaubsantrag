import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../config/app'
import { createTestUser, createTestBudget, generateTestToken } from '../../test/utils'

const app = createApp()

describe('Budget Routes', () => {
  let testUser: any
  let testToken: string

  beforeEach(async () => {
    // Test-User erstellen
    testUser = await createTestUser('employee')
    testToken = generateTestToken(testUser)
  })

  describe('GET /urlaub/budget/:userId', () => {
    it('gibt 401 zurück ohne Token', async () => {
      const response = await request(app)
        .get(`/api/urlaub/budget/${testUser.id}`)
      expect(response.status).toBe(401)
    })

    it('gibt eigenes Budget zurück', async () => {
      const budget = await createTestBudget(testUser.id, 2024)

      const response = await request(app)
        .get(`/api/urlaub/budget/${testUser.id}`)
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.budget).toMatchObject({
        mitarbeiterId: testUser.id,
        jahr: 2024,
        jahresanspruch: budget.jahresanspruch
      })
    })

    it('verhindert Zugriff auf fremde Budgets', async () => {
      await createTestBudget(999, 2024)

      const response = await request(app)
        .get('/api/urlaub/budget/999')
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(403)
    })

    it('filtert nach Jahr', async () => {
      await createTestBudget(testUser.id, 2024)
      await createTestBudget(testUser.id, 2025)

      const response = await request(app)
        .get(`/api/urlaub/budget/${testUser.id}`)
        .query({ jahr: 2024 })
        .set('Authorization', `Bearer ${testToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.budget.jahr).toBe(2024)
    })
  })

  describe('PUT /urlaub/budget/:userId', () => {
    it('erlaubt nur Managern und Admins das Budget zu ändern', async () => {
      const budget = await createTestBudget(testUser.id, 2024)

      const response = await request(app)
        .put(`/api/urlaub/budget/${testUser.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          jahresanspruch: 25
        })
      
      expect(response.status).toBe(403)
    })

    it('aktualisiert das Budget als Manager', async () => {
      const manager = await createTestUser('manager')
      const managerToken = generateTestToken(manager)
      const budget = await createTestBudget(testUser.id, 2024)

      const response = await request(app)
        .put(`/api/urlaub/budget/${testUser.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          jahresanspruch: 25,
          uebertrag: 5
        })
      
      expect(response.status).toBe(200)
      expect(response.body.budget).toMatchObject({
        jahresanspruch: 25,
        uebertrag: 5
      })
    })

    it('validiert den Jahresanspruch', async () => {
      const manager = await createTestUser('manager')
      const managerToken = generateTestToken(manager)
      const budget = await createTestBudget(testUser.id, 2024)

      const response = await request(app)
        .put(`/api/urlaub/budget/${testUser.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          jahresanspruch: 50 // Zu hoch
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Jahresanspruch')
    })

    it('validiert den Übertrag', async () => {
      const manager = await createTestUser('manager')
      const managerToken = generateTestToken(manager)
      const budget = await createTestBudget(testUser.id, 2024)

      const response = await request(app)
        .put(`/api/urlaub/budget/${testUser.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          uebertrag: 15 // Zu hoch
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Übertrag')
    })
  })
})
