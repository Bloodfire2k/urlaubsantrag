import { useState, useEffect } from 'react'
import { Market, User, Urlaub } from '../../types/vacation'
import { vacationService } from '../../services/vacation/vacationService'

export const useVacationData = (token: string | null, selectedYear: number) => {
  const [markets, setMarkets] = useState<Market[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [urlaube, setUrlaube] = useState<Urlaub[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!token) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        if (isMounted) setLoading(true)

        const [marketsData, usersData, urlaubeData] = await Promise.all([
          vacationService.fetchMarkets(token),
          vacationService.fetchUsers(token),
          vacationService.fetchUrlaube(token, selectedYear)
        ])

        if (isMounted) {
          setMarkets(marketsData)
          setUsers(usersData)
          setUrlaube(urlaubeData)
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error)
        if (isMounted) {
          setMarkets([])
          setUsers([])
          setUrlaube([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [token, selectedYear])

  return {
    markets,
    users,
    urlaube,
    loading
  }
}
