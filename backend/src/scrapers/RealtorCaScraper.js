const BaseScraper = require('./BaseScraper');
const { Listing } = require('../models');
const logger = require('../utils/logger');

class RealtorCaScraper extends BaseScraper {
  constructor(options = {}) {
    super('realtor_ca', {
      baseUrl: 'https://www.realtor.ca',
      searchUrl: 'https://www.realtor.ca/map',
      maxPages: 50,
      listingsPerPage: 20,
      ...options
    });

    this.searchCriteria = {
      transactionType: 'rent',
      provinceId: '9',
      cityIds: [],
      priceMin: null,
      priceMax: null,
      bedrooms: null,
      bathrooms: null,
      propertyTypes: []
    };
  }

  async scrape(searchParams = {}) {
    if (!await this.initialize()) {
      return false;
    }

    try {
      logger.info('Starting Realtor.ca scraping session');

      this.updateSearchCriteria(searchParams);
      const listings = await this.scrapeListings();

      await this.processListings(listings);

      await this.finalize('completed');
      return true;

    } catch (error) {
      logger.error('Realtor.ca scraping failed:', error);
      await this.logError(error);
      await this.finalize('failed');
      return false;
    }
  }

  updateSearchCriteria(params) {
    if (params.transactionType) this.searchCriteria.transactionType = params.transactionType;
    if (params.province) this.searchCriteria.provinceId = this.getProvinceId(params.province);
    if (params.cities) this.searchCriteria.cityIds = params.cities;
    if (params.priceMin) this.searchCriteria.priceMin = params.priceMin;
    if (params.priceMax) this.searchCriteria.priceMax = params.priceMax;
    if (params.bedrooms) this.searchCriteria.bedrooms = params.bedrooms;
    if (params.bathrooms) this.searchCriteria.bathrooms = params.bathrooms;
    if (params.propertyTypes) this.searchCriteria.propertyTypes = params.propertyTypes;
  }

  async scrapeListings() {
    const page = await this.createPage();
    const allListings = [];

    try {
      logger.info('Navigating to Realtor.ca search page');

      if (!await this.navigateWithRetry(page, this.options.searchUrl)) {
        throw new Error('Failed to navigate to search page');
      }

      await this.applySearchFilters(page);
      await this.randomDelay();

      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages && currentPage <= this.options.maxPages) {
        logger.info(`Scraping page ${currentPage}`);

        if (await this.checkForCaptcha(page) || await this.checkForRateLimit(page)) {
          logger.warn('Anti-bot detection triggered, stopping scrape');
          break;
        }

        const pageListings = await this.scrapeListingsFromPage(page);
        allListings.push(...pageListings);

        await this.updateStats(pageListings.length);

        hasMorePages = await this.navigateToNextPage(page);
        currentPage++;

        if (hasMorePages) {
          await this.randomDelay(3000, 5000);
        }
      }

    } finally {
      await page.close();
    }

    logger.info(`Scraped ${allListings.length} listings from ${currentPage - 1} pages`);
    return allListings;
  }

  async applySearchFilters(page) {
    try {
      await page.waitForSelector('[data-testid="search-filters"]', { timeout: 10000 });

      if (this.searchCriteria.transactionType === 'rent') {
        await page.click('[data-testid="for-rent-button"]');
        await this.randomDelay();
      }

      if (this.searchCriteria.priceMin || this.searchCriteria.priceMax) {
        await this.setPriceRange(page);
      }

      if (this.searchCriteria.bedrooms) {
        await this.setBedroomFilter(page);
      }

      if (this.searchCriteria.bathrooms) {
        await this.setBathroomFilter(page);
      }

      await page.click('[data-testid="apply-filters-button"]');
      await this.randomDelay();

    } catch (error) {
      logger.warn('Failed to apply some search filters:', error.message);
    }
  }

  async setPriceRange(page) {
    try {
      const priceButton = await page.$('[data-testid="price-filter-button"]');
      if (priceButton) {
        await priceButton.click();
        await this.randomDelay();

        if (this.searchCriteria.priceMin) {
          await page.type('[data-testid="price-min-input"]', this.searchCriteria.priceMin.toString());
        }

        if (this.searchCriteria.priceMax) {
          await page.type('[data-testid="price-max-input"]', this.searchCriteria.priceMax.toString());
        }

        await page.click('[data-testid="price-apply-button"]');
        await this.randomDelay();
      }
    } catch (error) {
      logger.warn('Failed to set price range:', error.message);
    }
  }

  async setBedroomFilter(page) {
    try {
      const bedroomButton = await page.$('[data-testid="bedroom-filter-button"]');
      if (bedroomButton) {
        await bedroomButton.click();
        await this.randomDelay();

        const bedroomOption = await page.$(`[data-testid="bedroom-${this.searchCriteria.bedrooms}"]`);
        if (bedroomOption) {
          await bedroomOption.click();
          await this.randomDelay();
        }
      }
    } catch (error) {
      logger.warn('Failed to set bedroom filter:', error.message);
    }
  }

  async setBathroomFilter(page) {
    try {
      const bathroomButton = await page.$('[data-testid="bathroom-filter-button"]');
      if (bathroomButton) {
        await bathroomButton.click();
        await this.randomDelay();

        const bathroomOption = await page.$(`[data-testid="bathroom-${this.searchCriteria.bathrooms}"]`);
        if (bathroomOption) {
          await bathroomOption.click();
          await this.randomDelay();
        }
      }
    } catch (error) {
      logger.warn('Failed to set bathroom filter:', error.message);
    }
  }

  async scrapeListingsFromPage(page) {
    return await this.safeEvaluate(page, () => {
      const listings = [];
      const listingElements = document.querySelectorAll('[data-testid="listing-card"]');

      listingElements.forEach(element => {
        try {
          const listing = {};

          const linkElement = element.querySelector('a[href*="/listing/"]');
          if (!linkElement) return;

          listing.url = linkElement.href;
          listing.external_id = this.extractExternalId(listing.url);

          const titleElement = element.querySelector('[data-testid="listing-title"]');
          listing.title = titleElement ? titleElement.textContent.trim() : '';

          const priceElement = element.querySelector('[data-testid="listing-price"]');
          const priceText = priceElement ? priceElement.textContent.trim() : '';
          listing.price = this.parsePrice(priceText);

          const addressElement = element.querySelector('[data-testid="listing-address"]');
          listing.address = addressElement ? addressElement.textContent.trim() : '';

          const detailsElement = element.querySelector('[data-testid="listing-details"]');
          if (detailsElement) {
            const detailsText = detailsElement.textContent;
            listing.bedrooms = this.extractNumber(detailsText, /(\d+)\s*bed/i);
            listing.bathrooms = this.extractNumber(detailsText, /(\d+(?:\.\d+)?)\s*bath/i);
            listing.square_feet = this.extractNumber(detailsText, /(\d+(?:,\d+)?)\s*sqft/i);
          }

          const imageElement = element.querySelector('img[src*="listing"]');
          listing.images = imageElement ? [imageElement.src] : [];

          listing.property_type = this.inferPropertyType(listing.title, listing.address);
          listing.listing_type = 'rent';
          listing.source = 'realtor_ca';

          const [city, province] = this.parseLocation(listing.address);
          listing.city = city;
          listing.province = province || 'ON';

          if (this.isValidListing(listing)) {
            listings.push(listing);
          }

        } catch (error) {
          console.error('Error parsing listing element:', error);
        }
      });

      return listings;
    });
  }

  extractExternalId(url) {
    const match = url.match(/listing\/([^\/\?]+)/);
    return match ? match[1] : url.split('/').pop().split('?')[0];
  }

  parsePrice(priceText) {
    const cleaned = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  extractNumber(text, regex) {
    const match = text.match(regex);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      return isNaN(num) ? null : num;
    }
    return null;
  }

  inferPropertyType(title, address) {
    const text = `${title} ${address}`.toLowerCase();

    if (text.includes('condo') || text.includes('condominium')) return 'condo';
    if (text.includes('townhouse') || text.includes('townhome')) return 'townhouse';
    if (text.includes('apartment') || text.includes('apt')) return 'apartment';
    if (text.includes('house') || text.includes('single')) return 'house';

    return 'other';
  }

  parseLocation(address) {
    const parts = address.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      const city = parts[parts.length - 2];
      const province = parts[parts.length - 1];
      return [city, province];
    }
    return [parts[0] || '', ''];
  }

  isValidListing(listing) {
    return listing.external_id &&
           listing.url &&
           listing.title &&
           listing.price > 0 &&
           listing.address &&
           listing.city;
  }

  async navigateToNextPage(page) {
    try {
      const nextButton = await page.$('[data-testid="next-page-button"]:not([disabled])');
      if (nextButton) {
        await nextButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        return true;
      }
      return false;
    } catch (error) {
      logger.debug('No next page available or navigation failed:', error.message);
      return false;
    }
  }

  async processListings(listings) {
    let newCount = 0;
    let updatedCount = 0;

    for (const listingData of listings) {
      try {
        const validation = this.validateListing(listingData);
        if (!validation.valid) {
          logger.warn(`Invalid listing data: ${validation.error}`);
          continue;
        }

        const [listing, created] = await Listing.upsert({
          ...listingData,
          last_scraped_at: new Date(),
          first_seen_at: created ? new Date() : undefined
        }, {
          conflictFields: ['external_id', 'source']
        });

        if (created) {
          newCount++;
          logger.debug(`New listing added: ${listing.external_id}`);
        } else {
          updatedCount++;
          logger.debug(`Listing updated: ${listing.external_id}`);
        }

      } catch (error) {
        logger.error('Error processing listing:', error);
        await this.logError(`Failed to process listing: ${error.message}`);
      }
    }

    await this.updateStats(0, newCount, updatedCount, 0);
    logger.info(`Processed ${listings.length} listings: ${newCount} new, ${updatedCount} updated`);
  }

  getProvinceId(provinceName) {
    const provinceMap = {
      'ontario': '9',
      'british columbia': '1',
      'alberta': '2',
      'quebec': '10',
      'manitoba': '4',
      'saskatchewan': '8',
      'nova scotia': '6',
      'new brunswick': '5',
      'newfoundland': '7',
      'prince edward island': '11'
    };

    return provinceMap[provinceName.toLowerCase()] || '9';
  }
}

module.exports = RealtorCaScraper;