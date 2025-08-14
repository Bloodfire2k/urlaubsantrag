import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

interface User {
  id: number
  username: string
  email: string
  fullName: string
  password_hash: string
  role: 'admin' | 'manager' | 'employee'
  market_id: number
  department?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Market {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  manager_id?: number
  created_at: string
  updated_at: string
}

interface UrlaubBudget {
  id: number
  mitarbeiterId: number
  jahr: number
  jahresanspruch: number
  genommen: number
  verplant: number
  uebertrag: number
  created_at: string
  updated_at: string
}

interface UrlaubAntrag {
  id: number
  mitarbeiterId: number
  startDatum: string
  endDatum: string
  bemerkung?: string
  status: 'pending' | 'approved' | 'rejected'
  genehmigt_von?: number
  genehmigt_am?: string
  created_at: string
  updated_at: string
}

interface AuditLog {
  id: number
  user_id?: number
  action: string
  table_name: string
  record_id?: number
  old_values?: string
  new_values?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export class DatabaseManager {
  private dataPath: string
  private users: User[] = []
  private markets: Market[] = []
  private urlaubBudgets: UrlaubBudget[] = []
  private urlaubAntraege: UrlaubAntrag[] = []
  private auditLogs: AuditLog[] = []
  private nextIds = {
    users: 1,
    markets: 1,
    urlaubBudgets: 1,
    urlaubAntraege: 1,
    auditLogs: 1
  }

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data')
    this.ensureDataDirectory()
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true })
    }
  }

  async init(): Promise<void> {
    try {
      console.log('✅ Initialisiere JSON-Datenbank...')
      
      await this.loadData()
      await this.ensureDemoCredentials() // Migration: Demo-Logins sicherstellen
      await this.createTables()
      await this.seedInitialData()
      
      console.log('✅ JSON-Datenbank erfolgreich initialisiert')
    } catch (error) {
      console.error('❌ Datenbankfehler:', error)
      throw error
    }
  }

  private async loadData(): Promise<void> {
    // Lade existierende Daten oder erstelle leere Arrays
    this.users = this.loadTable('users')
    this.markets = this.loadTable('markets')
    this.urlaubBudgets = this.loadTable('urlaub_budgets')
    this.urlaubAntraege = this.loadTable('urlaub_antraege')
    this.auditLogs = this.loadTable('audit_logs')

    // Aktualisiere nextIds basierend auf geladenen Daten
    this.nextIds.users = Math.max(1, ...this.users.map(u => u.id)) + 1
    this.nextIds.markets = Math.max(1, ...this.markets.map(m => m.id)) + 1
    this.nextIds.urlaubBudgets = Math.max(1, ...this.urlaubBudgets.map(b => b.id)) + 1
    this.nextIds.urlaubAntraege = Math.max(1, ...this.urlaubAntraege.map(a => a.id)) + 1
    this.nextIds.auditLogs = Math.max(1, ...this.auditLogs.map(l => l.id)) + 1
  }

  private loadTable<T>(tableName: string): T[] {
    const filePath = path.join(this.dataPath, `${tableName}.json`)
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
      } catch (error) {
        console.warn(`⚠️ Konnte ${tableName} nicht laden, verwende leere Tabelle`)
        return []
      }
    }
    return []
  }

  private saveTable<T>(tableName: string, data: T[]): void {
    const filePath = path.join(this.dataPath, `${tableName}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  }

  private async createTables(): Promise<void> {
    // Bei JSON-Datenbank sind "Tabellen" nur leere Arrays
    // Die Struktur wird durch TypeScript-Interfaces definiert
    console.log('✅ Alle Tabellen (Arrays) erstellt')
  }

  private async seedInitialData(): Promise<void> {
    try {
      if (this.users.length > 0) {
        console.log('ℹ️ Datenbank bereits mit Daten gefüllt')
        return
      }

      console.log('🌱 Fülle Datenbank mit Initial-Daten...')

      // Erstelle Demo-Märkte
      const market1: Market = {
        id: this.nextIds.markets++,
        name: 'E-Center',
        address: 'Musterstraße 1, 12345 Musterstadt',
        phone: '+49 123 456789',
        email: 'info@ecenter.de',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const market2: Market = {
        id: this.nextIds.markets++,
        name: 'Edeka',
        address: 'Beispielweg 15, 54321 Beispielstadt',
        phone: '+49 987 654321',
        email: 'info@edeka.de',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      this.markets.push(market1, market2)

      // Erstelle Admin-Benutzer
      const adminPasswordHash = await bcrypt.hash('admin123', 12)
      const admin: User = {
        id: this.nextIds.users++,
        username: 'admin',
        email: 'admin@unternehmen.de',
        fullName: 'Unternehmer Admin',
        password_hash: adminPasswordHash,
        role: 'admin',
        market_id: market1.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Erstelle Demo-Mitarbeiter (Passwörter gemäß Login-Hinweis)
      const maxPasswordHash = await bcrypt.hash('max123', 12)
      const annaPasswordHash = await bcrypt.hash('anna123', 12)
      const employeePasswordHash = await bcrypt.hash('demo123', 12) // für Manager-Demos
      const max: User = {
        id: this.nextIds.users++,
        username: 'max.mustermann',
        email: 'max@unternehmen.de',
        fullName: 'Max Mustermann',
        password_hash: maxPasswordHash,
        role: 'employee',
        market_id: market1.id,
        department: 'Entwicklung',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const anna: User = {
        id: this.nextIds.users++,
        username: 'anna.schmidt',
        email: 'anna@unternehmen.de',
        fullName: 'Anna Schmidt',
        password_hash: annaPasswordHash,
        role: 'employee',
        market_id: market2.id,
        department: 'Marketing',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const manager1: User = {
        id: this.nextIds.users++,
        username: 'manager1',
        email: 'manager1@unternehmen.de',
        fullName: 'Markt Manager 1',
        password_hash: employeePasswordHash,
        role: 'manager',
        market_id: market1.id,
        department: 'Geschäftsführung',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const manager2: User = {
        id: this.nextIds.users++,
        username: 'manager2',
        email: 'manager2@unternehmen.de',
        fullName: 'Markt Manager 2',
        password_hash: employeePasswordHash,
        role: 'manager',
        market_id: market2.id,
        department: 'Geschäftsführung',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      this.users.push(admin, max, anna, manager1, manager2)

      // Erstelle Urlaubsbudgets für 2025 (aktuelles Jahr)
      const budget1: UrlaubBudget = {
        id: this.nextIds.urlaubBudgets++,
        mitarbeiterId: admin.id,
        jahr: 2025,
        jahresanspruch: 30,
        genommen: 15,
        verplant: 0,
        uebertrag: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const budget2: UrlaubBudget = {
        id: this.nextIds.urlaubBudgets++,
        mitarbeiterId: max.id,
        jahr: 2025,
        jahresanspruch: 25,
        genommen: 0,
        verplant: 0,
        uebertrag: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const budget3: UrlaubBudget = {
        id: this.nextIds.urlaubBudgets++,
        mitarbeiterId: anna.id,
        jahr: 2025,
        jahresanspruch: 25,
        genommen: 0,
        verplant: 0,
        uebertrag: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const budget4: UrlaubBudget = {
        id: this.nextIds.urlaubBudgets++,
        mitarbeiterId: manager1.id,
        jahr: 2025,
        jahresanspruch: 28,
        genommen: 0,
        verplant: 0,
        uebertrag: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const budget5: UrlaubBudget = {
        id: this.nextIds.urlaubBudgets++,
        mitarbeiterId: manager2.id,
        jahr: 2025,
        jahresanspruch: 28,
        genommen: 0,
        verplant: 0,
        uebertrag: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      this.urlaubBudgets.push(budget1, budget2, budget3, budget4, budget5)

      // Speichere alle Daten
      this.saveAllData()

      console.log('✅ Initial-Daten erfolgreich eingefügt')
    } catch (error) {
      console.error('❌ Fehler beim Einfügen der Initial-Daten:', error)
    }
  }

  // Migration/Repair: Stelle sicher, dass Demo-Benutzer die im UI beworbenen Passwörter haben
  private async ensureDemoCredentials(): Promise<void> {
    let changed = false
    const max = this.users.find(u => u.username === 'max.mustermann')
    const anna = this.users.find(u => u.username === 'anna.schmidt')

    if (max) {
      const ok = await bcrypt.compare('max123', max.password_hash).catch(() => false)
      if (!ok) {
        max.password_hash = await bcrypt.hash('max123', 12)
        max.updated_at = new Date().toISOString()
        changed = true
      }
    }

    if (anna) {
      const ok = await bcrypt.compare('anna123', anna.password_hash).catch(() => false)
      if (!ok) {
        anna.password_hash = await bcrypt.hash('anna123', 12)
        anna.updated_at = new Date().toISOString()
        changed = true
      }
    }

    if (changed) {
      this.saveTable('users', this.users)
      console.log('🔧 Demo-Zugangsdaten synchronisiert (max/anna)')
    }
  }

  private saveAllData(): void {
    this.saveTable('users', this.users)
    this.saveTable('markets', this.markets)
    this.saveTable('urlaub_budgets', this.urlaubBudgets)
    this.saveTable('urlaub_antraege', this.urlaubAntraege)
    this.saveTable('audit_logs', this.auditLogs)
  }

  // Hilfsmethoden
  run(sql: string, params: any[] = []): any {
    // Simuliere SQL-ähnliche Operationen
    if (sql.toLowerCase().includes('insert into users')) {
      // Hier würde die Logik für INSERT stehen
      return { lastID: this.nextIds.users++, changes: 1 }
    }
    return { lastID: 0, changes: 0 }
  }

  get(sql: string, params: any[] = []): any {
    // Simuliere SQL-ähnliche Operationen
    if (sql.toLowerCase().includes('select count(*) from users')) {
      return { count: this.users.length }
    }
    if (sql.toLowerCase().includes('select * from users where username')) {
      const username = params[0]
      return this.users.find(u => u.username === username)
    }
    return null
  }

  all(sql: string, params: any[] = []): any[] {
    // Simuliere SQL-ähnliche Operationen
    if (sql.toLowerCase().includes('select * from users')) {
      return this.users
    }
    if (sql.toLowerCase().includes('select * from markets')) {
      return this.markets
    }
    if (sql.toLowerCase().includes('select * from urlaub_budgets')) {
      return this.urlaubBudgets
    }
    return []
  }

  isConnected(): boolean {
    return true // JSON-Datenbank ist immer "verbunden"
  }

  close(): void {
    this.saveAllData()
    console.log('✅ Alle Daten gespeichert')
  }

  // Transaktionen
  transaction<T>(fn: () => T): T {
    return fn()
  }

  // Spezielle Methoden für JSON-Datenbank
  getUserByUsername(username: string): User | undefined {
    return this.users.find(u => u.username === username)
  }

  getUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id)
  }

  getUsersByMarket(marketId: number): User[] {
    return this.users.filter(u => u.market_id === marketId)
  }

  getMarketById(id: number): Market | undefined {
    return this.markets.find(m => m.id === id)
  }

  addUrlaubBudget(budget: Omit<UrlaubBudget, 'id'>): UrlaubBudget {
    const newBudget: UrlaubBudget = {
      ...budget,
      id: this.nextIds.urlaubBudgets++
    }
    this.urlaubBudgets.push(newBudget)
    this.saveAllData()
    return newBudget
  }

  getUrlaubBudget(userId: number, jahr: number): UrlaubBudget | undefined {
    let budget = this.urlaubBudgets.find(b => b.mitarbeiterId === userId && b.jahr === jahr)
    
    if (budget) {
      // Verplante Tage neu berechnen basierend auf ausstehenden Anträgen
      const pendingAntraege = this.urlaubAntraege.filter(a => 
        a.mitarbeiterId === userId && 
        a.status === 'pending' &&
        new Date(a.startDatum).getFullYear() === jahr
      )
      
      // Einfache Tagesberechnung (wird später durch korrekte Berechnung ersetzt)
      const verplanteTage = pendingAntraege.reduce((total, antrag) => {
        const start = new Date(antrag.startDatum)
        const end = new Date(antrag.endDatum)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return total + diffDays
      }, 0)
      
      // Budget mit aktuellen verplanten Tagen zurückgeben
      return {
        ...budget,
        verplant: verplanteTage
      }
    }
    
    return budget
  }

  addUrlaubAntrag(antrag: Omit<UrlaubAntrag, 'id' | 'created_at' | 'updated_at'>): UrlaubAntrag {
    const newAntrag: UrlaubAntrag = {
      ...antrag,
      id: this.nextIds.urlaubAntraege++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.urlaubAntraege.push(newAntrag)
    this.saveAllData()
    return newAntrag
  }

  getAllUrlaubAntraege(): UrlaubAntrag[] {
    return this.urlaubAntraege
  }

  deleteUrlaubAntrag(id: number): boolean {
    const index = this.urlaubAntraege.findIndex(a => a.id === id)
    if (index === -1) return false
    this.urlaubAntraege.splice(index, 1)
    this.saveAllData()
    return true
  }

  updateUser(id: number, updates: Partial<User>): User | undefined {
    const index = this.users.findIndex(u => u.id === id)
    if (index === -1) return undefined
    
    this.users[index] = {
      ...this.users[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    this.saveAllData()
    return this.users[index]
  }

  deleteUser(id: number): boolean {
    const index = this.users.findIndex(u => u.id === id)
    if (index === -1) return false
    
    // Benutzer dauerhaft entfernen
    this.users.splice(index, 1)
    this.saveAllData()
    return true
  }

  addMarket(market: Omit<Market, 'id' | 'created_at' | 'updated_at'>): Market {
    const newMarket: Market = {
      ...market,
      id: this.nextIds.markets++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.markets.push(newMarket)
    this.saveAllData()
    return newMarket
  }

  // SQL-ähnliche Methoden für Kompatibilität
  all(query: string, params?: any[]): any[] {
    if (query.includes('SELECT * FROM users')) {
      if (query.includes('WHERE market_id')) {
        const marketId = params?.[0]
        return this.users.filter(u => u.market_id === marketId)
      }
      if (query.includes('WHERE id')) {
        const id = params?.[0]
        return this.users.filter(u => u.id === id)
      }
      return this.users
    }
    if (query.includes('SELECT * FROM markets')) {
      return this.markets
    }
    return []
  }

  addUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: User = {
      ...user,
      id: this.nextIds.users++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.users.push(newUser)
    this.saveTable('users', this.users)
    return newUser
  }

  addMarket(market: Omit<Market, 'id' | 'created_at' | 'updated_at'>): Market {
    const newMarket: Market = {
      ...market,
      id: this.nextIds.markets++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.markets.push(newMarket)
    this.saveTable('markets', this.markets)
    return newMarket
  }

  updateUser(id: number, updates: Partial<User>): User | null {
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) return null

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.saveTable('users', this.users)
    return this.users[userIndex]
  }

  updateMarket(id: number, updates: Partial<Market>): Market | null {
    const marketIndex = this.markets.findIndex(m => m.id === id)
    if (marketIndex === -1) return null

    this.markets[marketIndex] = {
      ...this.markets[marketIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.saveTable('markets', this.markets)
    return this.markets[marketIndex]
  }
}

// Exportiere eine Instanz
export const db = new DatabaseManager()
