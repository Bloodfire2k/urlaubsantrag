import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOverviewData } from './useOverviewData'

// Mock der Urlaubs-Daten
const mockUrlaube = [
  {
    id: '1',
    mitarbeiterId: 1,
    mitarbeiterName: 'Max Mustermann',
    startDatum: '2024-01-01',
    endDatum: '2024-01-05',
    status: 'pending',
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    mitarbeiterId: 2,
    mitarbeiterName: 'Anna Schmidt',
    startDatum: '2024-02-01',
    endDatum: '2024-02-05',
    status: 'approved',
    createdAt: '2024-01-15T10:00:00Z'
  }
]

describe('useOverviewData', () => {
  it('initialisiert mit korrekten Standardwerten', () => {
    const { result } = renderHook(() => useOverviewData([], 2024))

    expect(result.current.loading).toBe(true)
    expect(result.current.users).toEqual([])
    expect(result.current.markets).toEqual([
      { id: 2, name: 'E-Center', address: '', phone: '', email: '' },
      { id: 3, name: 'Edeka', address: '', phone: '', email: '' }
    ])
    expect(result.current.statusFilter).toBeNull()
  })

  it('lädt Benutzer beim ersten Render', async () => {
    const { result } = renderHook(() => useOverviewData(mockUrlaube, 2024))

    // Warte auf das Ende des Ladevorgangs
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
  })

  it('filtert Urlaube nach Status', () => {
    const { result } = renderHook(() => useOverviewData(mockUrlaube, 2024))

    act(() => {
      result.current.setStatusFilter('pending')
    })

    const filteredStats = result.current.getFilteredMitarbeiterStats()
    expect(filteredStats.length).toBeLessThan(mockUrlaube.length)
    expect(filteredStats.every(stat => 
      mockUrlaube.some(urlaub => 
        urlaub.mitarbeiterId === stat.id && urlaub.status === 'pending'
      )
    )).toBe(true)
  })

  it('berechnet Status-Counts korrekt', () => {
    const { result } = renderHook(() => useOverviewData(mockUrlaube, 2024))

    const counts = result.current.getStatusCounts()
    expect(counts).toHaveProperty('eingetragen')
    expect(counts).toHaveProperty('teilweise')
    expect(counts).toHaveProperty('nichtEingetragen')
    expect(Object.values(counts).every(count => typeof count === 'number')).toBe(true)
  })

  it('handhabt Mitarbeiter-Auswahl korrekt', () => {
    const { result } = renderHook(() => useOverviewData(mockUrlaube, 2024))

    act(() => {
      result.current.handleMitarbeiterClick(1)
    })

    expect(result.current.selectedMitarbeiter).toBe(1)
    expect(result.current.detailUrlaube).toEqual(
      mockUrlaube.filter(u => u.mitarbeiterId === 1)
    )
  })

  it('formatiert Datum korrekt', () => {
    const { result } = renderHook(() => useOverviewData(mockUrlaube, 2024))

    const formattedDate = result.current.formatDate('2024-01-01')
    expect(formattedDate).toMatch(/\d{2}\.\d{2}\.\d{4}/)
  })
})
