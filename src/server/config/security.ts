import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Helmet für grundlegende Sicherheitsheader
export const helmetConfig = helmet()

// Rate Limiting - Gelockerte Limits für Admin-Anwendung
export const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute (statt 15)
  max: 1000, // Max 1000 Requests pro IP (statt 100)
  message: 'Zu viele Anfragen von dieser IP, versuchen Sie es später erneut.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
