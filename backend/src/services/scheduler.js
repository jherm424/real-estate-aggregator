const cron = require('node-cron');
const scraperManager = require('../scrapers/index');
const { Listing } = require('../models');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.tasks = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    logger.info('Starting scheduler service');

    this.scheduleMainScraping();

    this.scheduleCleanupTasks();

    this.scheduleHealthChecks();

    this.isRunning = true;
    logger.info('Scheduler service started successfully');
  }

  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    logger.info('Stopping scheduler service');

    this.tasks.forEach((task, name) => {
      if (task && task.destroy) {
        task.destroy();
        logger.info(`Stopped scheduled task: ${name}`);
      }
    });

    this.tasks.clear();
    this.isRunning = false;

    logger.info('Scheduler service stopped');
  }

  scheduleMainScraping() {
    const scrapingSchedule = process.env.SCRAPING_SCHEDULE || '0 */6 * * *';

    const task = cron.schedule(scrapingSchedule, async () => {
      logger.info('Starting scheduled scraping session');

      try {
        const searchParams = {
          transactionType: 'rent',
          province: 'ontario',
          priceMax: 5000
        };

        const results = await scraperManager.runAllScrapers(searchParams);

        const successfulScrapes = Object.values(results).filter(Boolean).length;
        const totalScrapers = Object.keys(results).length;

        logger.info(`Scheduled scraping completed: ${successfulScrapes}/${totalScrapers} successful`);

        if (successfulScrapes === 0) {
          logger.error('All scheduled scrapers failed');
        }

      } catch (error) {
        logger.error('Scheduled scraping failed:', error);
      }
    }, {
      scheduled: false,
      timezone: "America/Toronto"
    });

    task.start();
    this.tasks.set('mainScraping', task);

    logger.info(`Main scraping scheduled with cron: ${scrapingSchedule}`);
  }

  scheduleCleanupTasks() {
    const cleanupSchedule = process.env.CLEANUP_SCHEDULE || '0 2 * * *';

    const task = cron.schedule(cleanupSchedule, async () => {
      logger.info('Starting scheduled cleanup tasks');

      try {
        await this.cleanupOldListings();
        await this.cleanupScrapingLogs();
        await this.updateListingStatuses();

        logger.info('Scheduled cleanup tasks completed');

      } catch (error) {
        logger.error('Scheduled cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: "America/Toronto"
    });

    task.start();
    this.tasks.set('cleanup', task);

    logger.info(`Cleanup tasks scheduled with cron: ${cleanupSchedule}`);
  }

  scheduleHealthChecks() {
    const healthCheckSchedule = '*/15 * * * *';

    const task = cron.schedule(healthCheckSchedule, async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    }, {
      scheduled: false,
      timezone: "America/Toronto"
    });

    task.start();
    this.tasks.set('healthCheck', task);

    logger.debug(`Health checks scheduled with cron: ${healthCheckSchedule}`);
  }

  async cleanupOldListings() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const deletedCount = await Listing.update(
        { status: 'expired' },
        {
          where: {
            last_scraped_at: {
              [require('sequelize').Op.lt]: cutoffDate
            },
            status: 'active'
          }
        }
      );

      logger.info(`Marked ${deletedCount[0]} old listings as expired`);

    } catch (error) {
      logger.error('Error cleaning up old listings:', error);
    }
  }

  async cleanupScrapingLogs() {
    try {
      const { ScrapingLog } = require('../models');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const deletedCount = await ScrapingLog.destroy({
        where: {
          started_at: {
            [require('sequelize').Op.lt]: cutoffDate
          }
        }
      });

      logger.info(`Deleted ${deletedCount} old scraping logs`);

    } catch (error) {
      logger.error('Error cleaning up scraping logs:', error);
    }
  }

  async updateListingStatuses() {
    try {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 7);

      const updatedCount = await Listing.update(
        { status: 'inactive' },
        {
          where: {
            last_scraped_at: {
              [require('sequelize').Op.lt]: staleDate
            },
            status: 'active'
          }
        }
      );

      logger.info(`Marked ${updatedCount[0]} stale listings as inactive`);

    } catch (error) {
      logger.error('Error updating listing statuses:', error);
    }
  }

  async performHealthCheck() {
    try {
      const runningScrapers = scraperManager.getRunningScrapers();

      if (runningScrapers.length > 0) {
        logger.debug(`Health check: ${runningScrapers.length} scrapers currently running`);
      }

      const activeListings = await Listing.count({
        where: { status: 'active' }
      });

      if (activeListings === 0) {
        logger.warn('Health check: No active listings found in database');
      }

      const recentListings = await Listing.count({
        where: {
          first_seen_at: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      logger.debug(`Health check: ${activeListings} active listings, ${recentListings} added in last 24h`);

    } catch (error) {
      logger.error('Health check error:', error);
    }
  }

  runManualScraping(sources = null, searchParams = {}) {
    if (!this.isRunning) {
      throw new Error('Scheduler service is not running');
    }

    logger.info('Running manual scraping session');

    if (sources && Array.isArray(sources)) {
      const promises = sources.map(source =>
        scraperManager.runScraper(source, searchParams)
      );
      return Promise.all(promises);
    } else {
      return scraperManager.runAllScrapers(searchParams);
    }
  }

  getSchedulerStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.tasks.keys()),
      taskCount: this.tasks.size,
      runningScrapers: scraperManager.getRunningScrapers(),
      availableScrapers: scraperManager.getAvailableScrapers()
    };
  }

  addCustomTask(name, cronExpression, taskFunction, options = {}) {
    if (this.tasks.has(name)) {
      throw new Error(`Task with name '${name}' already exists`);
    }

    const task = cron.schedule(cronExpression, taskFunction, {
      scheduled: false,
      timezone: options.timezone || "America/Toronto",
      ...options
    });

    task.start();
    this.tasks.set(name, task);

    logger.info(`Custom task '${name}' scheduled with cron: ${cronExpression}`);

    return task;
  }

  removeCustomTask(name) {
    if (!this.tasks.has(name)) {
      throw new Error(`Task with name '${name}' does not exist`);
    }

    const task = this.tasks.get(name);
    if (task && task.destroy) {
      task.destroy();
    }

    this.tasks.delete(name);
    logger.info(`Custom task '${name}' removed`);
  }

  listTasks() {
    return Array.from(this.tasks.keys());
  }

  pauseTask(name) {
    const task = this.tasks.get(name);
    if (task && task.stop) {
      task.stop();
      logger.info(`Task '${name}' paused`);
    }
  }

  resumeTask(name) {
    const task = this.tasks.get(name);
    if (task && task.start) {
      task.start();
      logger.info(`Task '${name}' resumed`);
    }
  }
}

const schedulerService = new SchedulerService();

if (require.main === module) {
  schedulerService.start();

  process.on('SIGINT', () => {
    logger.info('Received SIGINT, stopping scheduler...');
    schedulerService.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, stopping scheduler...');
    schedulerService.stop();
    process.exit(0);
  });
}

module.exports = schedulerService;