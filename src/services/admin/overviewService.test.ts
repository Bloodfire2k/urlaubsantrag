import { describe, it, expect, vi } from 'vitest'
import { overviewService } from './overviewService'

// Mock der API-Antworten
const mockUsers = [
  {
    id: 1,
    fullName: 'Max Mustermann',
    market_id: 1,
    department: 'IT',
    role: 'employee',
    is_active: true
  },
  {
    id: 2,
    fullName: 'Anna Schmidt',
    market_id: 1,
    department: 'HR',
    role: 'manager',
    is_active: true
  }
]

const mockMarkets = [
  { id: 1, name: 'E-Center', address: 'Hauptstraße 1' },
  { id: 2, name: 'Edeka', address: 'Bahnhofstraße 2' }
]

describe('overviewService', () => {
  // Mock der fetch-Funktion
  global.fetch = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('lädt Benutzer erfolgreich', async () => {
    // Mock der fetch-Antwort
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers })
    })

    const users = await overviewService.fetchUsers()
    expect(users).toEqual(mockUsers)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      expect.any(Object)
    )
  })

  it('lädt Märkte erfolgreich', async () => {
    // Mock der fetch-Antwort
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ markets: mockMarkets })
    })

    const markets = await overviewService.fetchMarkets()
    expect(markets).toEqual(mockMarkets)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/markets'),
      expect.any(Object)
    )
  })

  it('wirft einen Fehler bei fehlgeschlagenem API-Aufruf', async () => {
    // Mock eines fehlgeschlagenen API-Aufrufs
    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })

    await expect(overviewService.fetchUsers()).rejects.toThrow()
  })

  it('wirft einen Fehler bei fehlendem Token', async () => {
    // Mock localStorage.getItem
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    getItemSpy.mockReturnValue(null)

    await expect(overviewService.fetchUsers()).rejects.toThrow('Kein Token gefunden')
  })

  it('fügt den Authorization Header hinzu', async () => {
    // Mock localStorage.getItem
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    getItemSpy.mockReturnValue('test-token')

    // Mock der fetch-Antwort
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers })
    })

    await overviewService.fetchUsers()

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    )
  })
})
