import { db } from '../database'

export const setupGracefulShutdown = () => {
  process.on('SIGINT', () => {
    console.log('\n🔄 Server wird heruntergefahren...')
    db.close()
    process.exit(0)
  })
}
