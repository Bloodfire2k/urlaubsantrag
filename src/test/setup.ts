import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'

// Erweitere die Vitest Assertions um Testing Library Matchers
expect.extend(matchers)

// Cleanup nach jedem Test
afterEach(() => {
  cleanup()
})
