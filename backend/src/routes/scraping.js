const express = require('express');
const scraperManager = require('../scrapers/index');
const { ScrapingLog } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    const availableScrapers = scraperManager.getAvailableScrapers();
    const runningScrapers = scraperManager.getRunningScrapers();

    const recentLogs = await ScrapingLog.findAll({
      order: [['started_at', 'DESC']],
      limit: 10,
      attributes: [
        'id',
        'source',
        'status',
        'started_at',
        'completed_at',
        'duration_seconds',
        'listings_found',
        'listings_new',
        'listings_updated',
        'listings_removed'
      ]
    });

    res.json({
      available_scrapers: availableScrapers,
      running_scrapers: runningScrapers,
      recent_logs: recentLogs
    });

  } catch (error) {
    logger.error('Error fetching scraping status:', error);
    res.status(500).json({
      error: 'Failed to fetch scraping status',
      message: error.message
    });
  }
});

router.post('/start/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const searchParams = req.body;

    const availableScrapers = scraperManager.getAvailableScrapers();
    if (!availableScrapers.includes(source)) {
      return res.status(400).json({
        error: 'Invalid scraper source',
        message: `Available scrapers: ${availableScrapers.join(', ')}`
      });
    }

    if (scraperManager.isScraperRunning(source)) {
      return res.status(409).json({
        error: 'Scraper already running',
        message: `Scraper for ${source} is currently active`
      });
    }

    logger.info(`Starting manual scrape for ${source}`, { searchParams });

    scraperManager.runScraper(source, searchParams)
      .then(result => {
        logger.info(`Manual scrape for ${source} completed: ${result}`);
      })
      .catch(error => {
        logger.error(`Manual scrape for ${source} failed:`, error);
      });

    res.json({
      message: `Scraping started for ${source}`,
      source: source,
      search_params: searchParams
    });

  } catch (error) {
    logger.error('Error starting scraper:', error);
    res.status(500).json({
      error: 'Failed to start scraper',
      message: error.message
    });
  }
});

router.post('/start-all', async (req, res) => {
  try {
    const searchParams = req.body;

    const runningScrapers = scraperManager.getRunningScrapers();
    if (runningScrapers.length > 0) {
      return res.status(409).json({
        error: 'Scrapers already running',
        message: `Active scrapers: ${runningScrapers.join(', ')}`
      });
    }

    logger.info('Starting all scrapers', { searchParams });

    scraperManager.runAllScrapers(searchParams)
      .then(results => {
        logger.info('All scrapers completed', { results });
      })
      .catch(error => {
        logger.error('Error in batch scraping:', error);
      });

    res.json({
      message: 'Scraping started for all available sources',
      available_scrapers: scraperManager.getAvailableScrapers(),
      search_params: searchParams
    });

  } catch (error) {
    logger.error('Error starting all scrapers:', error);
    res.status(500).json({
      error: 'Failed to start scrapers',
      message: error.message
    });
  }
});

router.post('/stop/:source', async (req, res) => {
  try {
    const { source } = req.params;

    if (!scraperManager.isScraperRunning(source)) {
      return res.status(400).json({
        error: 'Scraper not running',
        message: `No active scraper found for ${source}`
      });
    }

    const result = await scraperManager.stopScraper(source);

    res.json({
      message: result ? `Scraper for ${source} stopped successfully` : `Failed to stop scraper for ${source}`,
      source: source,
      stopped: result
    });

  } catch (error) {
    logger.error('Error stopping scraper:', error);
    res.status(500).json({
      error: 'Failed to stop scraper',
      message: error.message
    });
  }
});

router.post('/stop-all', async (req, res) => {
  try {
    const runningScrapers = scraperManager.getRunningScrapers();

    if (runningScrapers.length === 0) {
      return res.status(400).json({
        error: 'No scrapers running',
        message: 'No active scrapers to stop'
      });
    }

    const results = await scraperManager.stopAllScrapers();

    res.json({
      message: 'All scrapers stopped',
      results: results
    });

  } catch (error) {
    logger.error('Error stopping all scrapers:', error);
    res.status(500).json({
      error: 'Failed to stop scrapers',
      message: error.message
    });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      source,
      status,
      start_date,
      end_date
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    if (source) whereClause.source = source;
    if (status) whereClause.status = status;

    if (start_date || end_date) {
      whereClause.started_at = {};
      if (start_date) whereClause.started_at[require('sequelize').Op.gte] = new Date(start_date);
      if (end_date) whereClause.started_at[require('sequelize').Op.lte] = new Date(end_date);
    }

    const { count, rows: logs } = await ScrapingLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [['started_at', 'DESC']],
      attributes: {
        exclude: ['metadata']
      }
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      logs,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_count: count,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      }
    });

  } catch (error) {
    logger.error('Error fetching scraping logs:', error);
    res.status(500).json({
      error: 'Failed to fetch scraping logs',
      message: error.message
    });
  }
});

router.get('/logs/:logId', async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await ScrapingLog.findByPk(logId);

    if (!log) {
      return res.status(404).json({
        error: 'Log not found',
        message: `No scraping log found with ID: ${logId}`
      });
    }

    res.json({ log });

  } catch (error) {
    logger.error('Error fetching scraping log:', error);
    res.status(500).json({
      error: 'Failed to fetch scraping log',
      message: error.message
    });
  }
});

module.exports = router;