console.log('Starting app.js...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');
const accountRoutes = require('./routes/accountRoutes');
require('dotenv').config();

const app = express();

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:4200',
  'https://klykly-auth-frontend.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn(`Origin ${origin} not allowed by CORS`);
      return callback(new Error('Not allowed by CORS'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log('✅ Swagger docs available at /api-docs');

// Routes
app.use('/accounts', accountRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Angular Auth API',
    documentation: '/api-docs',
    endpoints: {
      health: '/accounts/health',
      register: '/accounts/register',
      login: '/accounts/authenticate',
      docs: '/api-docs'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;