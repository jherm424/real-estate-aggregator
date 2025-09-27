const RealtorCaScraper = require('./RealtorCaScraper');
const logger = require('../utils/logger');

class ScraperManager {
  constructor() {
    this.scrapers = {
      'realtor_ca': RealtorCaScraper
    };
    this.activeScrapes = new Map();
  }

  async runScraper(source, searchParams = {}) {
    try {
      if (this.activeScrapes.has(source)) {
        logger.warn(`Scraper for ${source} is already running`);
        return false;
      }

      const ScraperClass = this.scrapers[source];
      if (!ScraperClass) {
        logger.error(`Unknown scraper source: ${source}`);
        return false;
      }

      logger.info(`Starting scraper for ${source}`);
      const scraper = new ScraperClass();
      this.activeScrapes.set(source, scraper);

      const result = await scraper.scrape(searchParams);

      this.activeScrapes.delete(source);
      logger.info(`Scraper for ${source} completed with result: ${result}`);

      return result;

    } catch (error) {
      logger.error(`Scraper for ${source} failed:`, error);
      this.activeScrapes.delete(source);
      return false;
    }
  }

  async runAllScrapers(searchParams = {}) {
    const results = {};
    const sources = Object.keys(this.scrapers);

    logger.info(`Running all scrapers for sources: ${sources.join(', ')}`);

    for (const source of sources) {
      results[source] = await this.runScraper(source, searchParams);

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const successfulScrapes = Object.values(results).filter(Boolean).length;
    logger.info(`Scraping completed: ${successfulScrapes}/${sources.length} successful`);

    return results;
  }

  getAvailableScrapers() {
    return Object.keys(this.scrapers);
  }

  isScraperRunning(source) {
    return this.activeScrapes.has(source);
  }

  getRunningScrapers() {
    return Array.from(this.activeScrapes.keys());
  }

  async stopScraper(source) {
    if (this.activeScrapes.has(source)) {
      const scraper = this.activeScrapes.get(source);
      await scraper.finalize('cancelled');
      this.activeScrapes.delete(source);
      logger.info(`Scraper for ${source} stopped`);
      return true;
    }
    return false;
  }

  async stopAllScrapers() {
    const sources = Array.from(this.activeScrapes.keys());
    const results = {};

    for (const source of sources) {
      results[source] = await this.stopScraper(source);
    }

    logger.info(`Stopped ${sources.length} active scrapers`);
    return results;
  }
}

const scraperManager = new ScraperManager();

if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    const source = args[0] || 'realtor_ca';

    const searchParams = {
      transactionType: 'rent',
      province: 'ontario',
      priceMax: 3000
    };

    logger.info('Starting manual scrape...');
    const result = await scraperManager.runScraper(source, searchParams);

    if (result) {
      logger.info('Manual scrape completed successfully');
    } else {
      logger.error('Manual scrape failed');
    }

    process.exit(result ? 0 : 1);
  }

  main().catch(error => {
    logger.error('Manual scrape error:', error);
    process.exit(1);
  });
}

module.exports = scraperManager;