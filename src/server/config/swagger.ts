import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Urlaubsantrag API',
      version: '1.0.0',
      description: 'API für die Verwaltung von Urlaubsanträgen',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002/api',
        description: 'Lokaler Entwicklungsserver'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/server/routes/**/*.ts'] // Pfade zu den Route-Dateien
}

export const swaggerSpec = swaggerJsdoc(options)
