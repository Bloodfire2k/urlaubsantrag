import { httpGetJson } from '../../lib/http'

export const departmentService = {
  // Alle Abteilungen laden
  async loadDepartments(token?: string): Promise<string[]> {
    try {
      const data = await httpGetJson('/users/departments')
      return data.departments
    } catch (error) {
      console.error('Fehler beim Laden der Abteilungen:', error)
      return []
    }
  }
}

