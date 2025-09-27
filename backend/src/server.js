require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');
const logger = require('./utils/logger');

const listingsRoutes = require('./routes/listings');
const favoritesRoutes = require('./routes/favorites');
const searchesRoutes = require('./routes/searches');
const statsRoutes = require('./routes/stats');
const scrapingRoutes = require('./routes/scraping');
const schedulerRoutes = require('./routes/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/listings', listingsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/searches', searchesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/scheduler', schedulerRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Real Estate Listing Aggregator API',
    version: '1.0.0',
    endpoints: {
      listings: '/api/listings',
      favorites: '/api/favorites',
      searches: '/api/searches',
      stats: '/api/stats',
      scraping: '/api/scraping',
      health: '/api/health'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.path} does not exist.`,
    availableEndpoints: [
      'GET /api',
      'GET /api/health',
      'GET /api/listings',
      'GET /api/favorites',
      'GET /api/searches',
      'GET /api/stats'
    ]
  });
});

app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details
    });
  }

  if (error.name === 'SequelizeError') {
    return res.status(500).json({
      error: 'Database Error',
      message: 'An error occurred while processing your request.'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.'
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    if (process.env.NODE_ENV !== 'test') {
      await sequelize.sync({ alter: false });
      logger.info('Database synchronized');
    }

    const schedulerService = require('./services/scheduler');
    if (process.env.NODE_ENV !== 'test' && process.env.AUTO_START_SCHEDULER !== 'false') {
      schedulerService.start();
      logger.info('Scheduler service started automatically');
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;