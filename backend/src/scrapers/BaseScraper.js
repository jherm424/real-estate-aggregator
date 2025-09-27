const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserPreferencesPlugin = require('puppeteer-extra-plugin-user-preferences');
const { ScrapingLog } = require('../models');
const logger = require('../utils/logger');

puppeteer.use(StealthPlugin());
puppeteer.use(UserPreferencesPlugin({
  userPrefs: {
    webkit: {
      webprefs: {
        default_encoding: 'ISO-8859-1'
      }
    }
  }
}));

class BaseScraper {
  constructor(source, options = {}) {
    this.source = source;
    this.options = {
      headless: true,
      slowMo: 100,
      timeout: 30000,
      maxRetries: 3,
      delayBetweenRequests: 2000,
      maxConcurrentPages: 3,
      userAgentRotation: true,
      ...options
    };

    this.browser = null;
    this.scrapingLogId = null;
    this.stats = {
      found: 0,
      new: 0,
      updated: 0,
      removed: 0,
      errors: []
    };
  }

  async initialize() {
    try {
      logger.info(`Initializing ${this.source} scraper`);

      const scrapingLog = await ScrapingLog.create({
        source: this.source,
        status: 'started',
        started_at: new Date()
      });
      this.scrapingLogId = scrapingLog.id;

      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        slowMo: this.options.slowMo,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      logger.info(`${this.source} scraper initialized successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to initialize ${this.source} scraper:`, error);
      await this.logError(error);
      return false;
    }
  }

  async createPage() {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();

    await page.setViewport({
      width: 1366 + Math.floor(Math.random() * 100),
      height: 768 + Math.floor(Math.random() * 100)
    });

    if (this.options.userAgentRotation) {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
      ];
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      await page.setUserAgent(randomUserAgent);
    }

    await page.setDefaultTimeout(this.options.timeout);
    await page.setDefaultNavigationTimeout(this.options.timeout);

    page.on('response', response => {
      if (response.status() >= 400) {
        logger.warn(`HTTP ${response.status()} for ${response.url()}`);
      }
    });

    page.on('pageerror', error => {
      logger.error('Page error:', error);
    });

    return page;
  }

  async navigateWithRetry(page, url, maxRetries = null) {
    const retries = maxRetries || this.options.maxRetries;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(`Navigating to ${url} (attempt ${attempt}/${retries})`);

        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: this.options.timeout
        });

        await this.randomDelay();
        return true;

      } catch (error) {
        logger.warn(`Navigation attempt ${attempt} failed for ${url}:`, error.message);

        if (attempt === retries) {
          await this.logError(`Failed to navigate to ${url} after ${retries} attempts: ${error.message}`);
          return false;
        }

        await this.randomDelay(3000, 6000);
      }
    }
  }

  async randomDelay(min = null, max = null) {
    const minDelay = min || this.options.delayBetweenRequests;
    const maxDelay = max || this.options.delayBetweenRequests + 1000;
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    logger.debug(`Waiting ${delay}ms before next action`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async checkForCaptcha(page) {
    try {
      const captchaSelectors = [
        '[class*="captcha"]',
        '[id*="captcha"]',
        '.g-recaptcha',
        '[class*="recaptcha"]',
        '.h-captcha',
        '[class*="hcaptcha"]'
      ];

      for (const selector of captchaSelectors) {
        const captchaElement = await page.$(selector);
        if (captchaElement) {
          logger.warn('CAPTCHA detected on page');
          await this.logError('CAPTCHA challenge detected');
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error checking for CAPTCHA:', error);
      return false;
    }
  }

  async checkForRateLimit(page) {
    try {
      const rateLimitIndicators = [
        'too many requests',
        'rate limit',
        'blocked',
        'access denied',
        '429',
        'slow down'
      ];

      const pageContent = await page.content();
      const pageTitle = await page.title();
      const pageText = `${pageContent} ${pageTitle}`.toLowerCase();

      for (const indicator of rateLimitIndicators) {
        if (pageText.includes(indicator)) {
          logger.warn('Rate limiting detected on page');
          await this.logError('Rate limiting detected');
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error checking for rate limiting:', error);
      return false;
    }
  }

  async safeEvaluate(page, fn, ...args) {
    try {
      return await page.evaluate(fn, ...args);
    } catch (error) {
      logger.error('Page evaluation error:', error);
      await this.logError(`Page evaluation failed: ${error.message}`);
      return null;
    }
  }

  async safeWaitForSelector(page, selector, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      logger.debug(`Selector not found: ${selector}`);
      return false;
    }
  }

  async logError(error) {
    const errorMessage = typeof error === 'string' ? error : error.message || error.toString();
    this.stats.errors.push({
      timestamp: new Date(),
      message: errorMessage
    });
    logger.error(`${this.source} scraper error: ${errorMessage}`);
  }

  async updateStats(found = 0, newCount = 0, updated = 0, removed = 0) {
    this.stats.found += found;
    this.stats.new += newCount;
    this.stats.updated += updated;
    this.stats.removed += removed;
  }

  async finalize(status = 'completed') {
    try {
      if (this.browser) {
        await this.browser.close();
      }

      if (this.scrapingLogId) {
        const duration = Math.floor((new Date() - new Date()) / 1000);

        await ScrapingLog.update({
          status,
          completed_at: new Date(),
          duration_seconds: duration,
          listings_found: this.stats.found,
          listings_new: this.stats.new,
          listings_updated: this.stats.updated,
          listings_removed: this.stats.removed,
          errors: this.stats.errors
        }, {
          where: { id: this.scrapingLogId }
        });
      }

      logger.info(`${this.source} scraper finalized with status: ${status}`);
      logger.info(`Stats - Found: ${this.stats.found}, New: ${this.stats.new}, Updated: ${this.stats.updated}, Removed: ${this.stats.removed}`);

    } catch (error) {
      logger.error('Error during scraper finalization:', error);
    }
  }

  async scrape() {
    throw new Error('scrape() method must be implemented by subclass');
  }

  validateListing(listing) {
    const required = ['external_id', 'source', 'url', 'title', 'price', 'listing_type', 'property_type', 'address', 'city', 'province'];

    for (const field of required) {
      if (!listing[field]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    if (typeof listing.price !== 'number' || listing.price <= 0) {
      return { valid: false, error: 'Invalid price value' };
    }

    return { valid: true };
  }

  normalizePrice(priceString) {
    if (typeof priceString === 'number') return priceString;

    const cleaned = priceString.toString()
      .replace(/[^\d.,]/g, '')
      .replace(/,/g, '');

    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  normalizeAddress(address) {
    return address
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/^,|,$/g, '');
  }
}

module.exports = BaseScraper;