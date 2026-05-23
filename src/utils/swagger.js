const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Angular Auth API',
      version: '1.0.0',
      description: 'Authentication API with email verification, JWT tokens, and password reset'
    },
    servers: [
      {
        url: process.env.API_URL || 'https://klykly-auth-backend.onrender.com',
        description: 'Production Server'
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
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);