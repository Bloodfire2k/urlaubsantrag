import jwt from 'jsonwebtoken'
import { db } from '../database'

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required') })()

// Test-User erstellen
export const createTestUser = async (role: 'admin' | 'manager' | 'employee' = 'employee') => {
  const user = {
    id: 1,
    username: 'test.user',
    email: 'test@example.com',
    fullName: 'Test User',
    role,
    market_id: 1,
    department: 'IT',
    is_active: true
  }

  await db.addUser(user)
  return user
}

// JWT Token für Test-User generieren
export const generateTestToken = (user: any) => {
  return jwt.sign(
    { 
      userId: user.id,
      username: user.username,
      role: user.role,
      marketId: user.market_id
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  )
}

// Test-Urlaubsantrag erstellen
export const createTestUrlaub = async (userId: number) => {
  const urlaub = {
    id: '1',
    mitarbeiterId: userId,
    startDatum: '2024-01-01',
    endDatum: '2024-01-05',
    status: 'pending',
    bemerkung: 'Test Urlaub',
    created_at: new Date().toISOString()
  }

  await db.addUrlaubAntrag(urlaub)
  return urlaub
}

// Test-Budget erstellen
export const createTestBudget = async (userId: number, jahr: number) => {
  const budget = {
    id: 1,
    mitarbeiterId: userId,
    jahr,
    jahresanspruch: 30,
    genommen: 0,
    verplant: 0,
    uebertrag: 0
  }

  await db.addUrlaubBudget(budget)
  return budget
}
