import { beforeAll, afterAll, afterEach } from 'vitest'
import { db } from '../database'

// Setup vor allen Tests
beforeAll(async () => {
  // Datenbank initialisieren
  await db.init()
})

// Cleanup nach allen Tests
afterAll(async () => {
  // Datenbank schließen
  await db.close()
})

// Cleanup nach jedem Test
afterEach(async () => {
  // Datenbank zurücksetzen
  await db.reset()
})
