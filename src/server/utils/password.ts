// Robustes bcrypt/bcryptjs Interop ohne Top-Level-await
function getBcrypt() {
  try {
    // Versuche zuerst bcryptjs (reine JS-Implementierung)
    return require('bcryptjs')
  } catch {
    try {
      // Fallback auf bcrypt (native Implementierung)
      return require('bcrypt')
    } catch {
      throw new Error('Neither bcryptjs nor bcrypt are available')
    }
  }
}

export const password = {
  hash: (p: string, r: number = 10) => {
    const bcrypt = getBcrypt()
    return bcrypt.hash(p, r)
  },
  compare: (p: string, h: string) => {
    const bcrypt = getBcrypt()
    return bcrypt.compare(p, h)
  }
}

// Export für direkten Zugriff
export const verifyPassword = password.compare
export const hashPassword = password.hash
