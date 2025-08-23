import * as bcrypt from 'bcryptjs'

export const password = {
  hash: (p: string, r: number = 10) => bcrypt.hash(p, r),
  compare: (p: string, h: string) => bcrypt.compare(p, h)
}
