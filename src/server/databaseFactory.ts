import { DatabaseManager } from './database'
import { PrismaClient } from '@prisma/client'

export interface IDatabase {
  init(): Promise<void>
  // Fügen Sie hier alle benötigten Methoden hinzu
  getUserById(id: number): any
  getAllUsers(): any[]
  // ... weitere Methoden
}

export class DatabaseFactory {
  static async createDatabase(): Promise<IDatabase> {
    const dbType = process.env.DB_TYPE || 'json'
    
    switch (dbType) {
      case 'sqlite':
        console.log('🗄️ Verwende SQLite-Datenbank')
        const prisma = new PrismaClient()
        await prisma.$connect()
        return new PrismaDatabaseAdapter(prisma)
      
      case 'json':
      default:
        console.log('📁 Verwende JSON-Datenbank')
        const jsonDb = new DatabaseManager()
        await jsonDb.init()
        return new JsonDatabaseAdapter(jsonDb)
    }
  }
}

class JsonDatabaseAdapter implements IDatabase {
  constructor(private db: DatabaseManager) {}
  
  async init(): Promise<void> {
    // JSON-DB ist bereits initialisiert
  }
  
  getUserById(id: number): any {
    return this.db.getUserById(id)
  }
  
  getAllUsers(): any[] {
    return this.db.getAllUsers()
  }
  
  // Implementieren Sie hier alle anderen benötigten Methoden
}

class PrismaDatabaseAdapter implements IDatabase {
  constructor(private prisma: PrismaClient) {}
  
  async init(): Promise<void> {
    // Prisma ist bereits verbunden
  }
  
  async getUserById(id: number): Promise<any> {
    return await this.prisma.user.findUnique({
      where: { id }
    })
  }
  
  async getAllUsers(): Promise<any[]> {
    return await this.prisma.user.findMany()
  }
  
  // Implementieren Sie hier alle anderen benötigten Methoden
}
