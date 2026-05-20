const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const accountRoutes = require('./routes/accountRoutes');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/accounts', accountRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;