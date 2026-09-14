const express = require('express');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const { errorHandler, sendError } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'user-service' });
  });

  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);

  // Unknown route
  app.use((req, res) => {
    sendError(res, 404, 'Not Found', 'Resource not found');
  });

  // Centralized error handler - must be registered last.
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
