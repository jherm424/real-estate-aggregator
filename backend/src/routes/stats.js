const express = require('express');
const { Op } = require('sequelize');
const { Listing, ScrapingLog, Favorite, sequelize } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let dateFilter;
    const now = new Date();

    switch (period) {
      case '24h':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      totalListings,
      activeListings,
      newListings,
      listingsBySource,
      listingsByType,
      listingsByPropertyType,
      averagePrice,
      priceRanges,
      recentActivity,
      scrapingStats
    ] = await Promise.all([
      Listing.count(),

      Listing.count({
        where: { status: 'active' }
      }),

      Listing.count({
        where: {
          first_seen_at: { [Op.gte]: dateFilter }
        }
      }),

      Listing.findAll({
        attributes: [
          'source',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { status: 'active' },
        group: ['source'],
        raw: true
      }),

      Listing.findAll({
        attributes: [
          'listing_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { status: 'active' },
        group: ['listing_type'],
        raw: true
      }),

      Listing.findAll({
        attributes: [
          'property_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { status: 'active' },
        group: ['property_type'],
        raw: true
      }),

      Listing.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('price')), 'average_price']
        ],
        where: {
          status: 'active',
          price: { [Op.gt]: 0 }
        },
        raw: true
      }),

      sequelize.query(`
        SELECT
          CASE
            WHEN price < 1000 THEN 'Under $1,000'
            WHEN price >= 1000 AND price < 1500 THEN '$1,000 - $1,500'
            WHEN price >= 1500 AND price < 2000 THEN '$1,500 - $2,000'
            WHEN price >= 2000 AND price < 2500 THEN '$2,000 - $2,500'
            WHEN price >= 2500 AND price < 3000 THEN '$2,500 - $3,000'
            WHEN price >= 3000 THEN 'Over $3,000'
          END as price_range,
          COUNT(*) as count
        FROM listings
        WHERE status = 'active' AND price > 0
        GROUP BY
          CASE
            WHEN price < 1000 THEN 'Under $1,000'
            WHEN price >= 1000 AND price < 1500 THEN '$1,000 - $1,500'
            WHEN price >= 1500 AND price < 2000 THEN '$1,500 - $2,000'
            WHEN price >= 2000 AND price < 2500 THEN '$2,000 - $2,500'
            WHEN price >= 2500 AND price < 3000 THEN '$2,500 - $3,000'
            WHEN price >= 3000 THEN 'Over $3,000'
          END
        ORDER BY MIN(price)
      `, { type: sequelize.QueryTypes.SELECT }),

      Listing.findAll({
        attributes: ['id', 'title', 'price', 'city', 'source', 'first_seen_at'],
        where: {
          first_seen_at: { [Op.gte]: dateFilter }
        },
        order: [['first_seen_at', 'DESC']],
        limit: 10
      }),

      ScrapingLog.findAll({
        attributes: [
          'source',
          'status',
          'started_at',
          'completed_at',
          'listings_found',
          'listings_new',
          'listings_updated'
        ],
        where: {
          started_at: { [Op.gte]: dateFilter }
        },
        order: [['started_at', 'DESC']],
        limit: 20
      })
    ]);

    const stats = {
      overview: {
        total_listings: totalListings,
        active_listings: activeListings,
        new_listings_period: newListings,
        period: period,
        average_price: averagePrice ? Math.round(parseFloat(averagePrice.average_price)) : 0
      },

      distribution: {
        by_source: listingsBySource.map(item => ({
          source: item.source,
          count: parseInt(item.count)
        })),

        by_listing_type: listingsByType.map(item => ({
          type: item.listing_type,
          count: parseInt(item.count)
        })),

        by_property_type: listingsByPropertyType.map(item => ({
          type: item.property_type,
          count: parseInt(item.count)
        })),

        by_price_range: priceRanges.map(item => ({
          range: item.price_range,
          count: parseInt(item.count)
        }))
      },

      recent_activity: {
        new_listings: recentActivity,
        scraping_logs: scrapingStats
      },

      period_info: {
        period: period,
        start_date: dateFilter.toISOString(),
        end_date: now.toISOString()
      }
    };

    res.json(stats);

  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

router.get('/cities', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const cityStats = await Listing.findAll({
      attributes: [
        'city',
        'province',
        [sequelize.fn('COUNT', sequelize.col('id')), 'listing_count'],
        [sequelize.fn('AVG', sequelize.col('price')), 'average_price'],
        [sequelize.fn('MIN', sequelize.col('price')), 'min_price'],
        [sequelize.fn('MAX', sequelize.col('price')), 'max_price']
      ],
      where: {
        status: 'active',
        price: { [Op.gt]: 0 }
      },
      group: ['city', 'province'],
      order: [[sequelize.literal('listing_count'), 'DESC']],
      limit: parseInt(limit),
      raw: true
    });

    const formattedStats = cityStats.map(city => ({
      city: city.city,
      province: city.province,
      listing_count: parseInt(city.listing_count),
      average_price: Math.round(parseFloat(city.average_price)),
      min_price: parseFloat(city.min_price),
      max_price: parseFloat(city.max_price)
    }));

    res.json({
      city_statistics: formattedStats
    });

  } catch (error) {
    logger.error('Error fetching city statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch city statistics',
      message: error.message
    });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const { period = '30d', metric = 'count' } = req.query;

    let dateFilter;
    let groupBy;
    const now = new Date();

    switch (period) {
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(first_seen_at)';
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(first_seen_at)';
        break;
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE_TRUNC(\'week\', first_seen_at)';
        break;
      default:
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(first_seen_at)';
    }

    let selectClause;
    if (metric === 'average_price') {
      selectClause = `${groupBy} as date, AVG(price) as value`;
    } else {
      selectClause = `${groupBy} as date, COUNT(*) as value`;
    }

    const trendData = await sequelize.query(`
      SELECT ${selectClause}
      FROM listings
      WHERE first_seen_at >= :dateFilter
        AND status = 'active'
        ${metric === 'average_price' ? 'AND price > 0' : ''}
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `, {
      replacements: { dateFilter },
      type: sequelize.QueryTypes.SELECT
    });

    const formattedTrends = trendData.map(item => ({
      date: item.date,
      value: metric === 'average_price' ? Math.round(parseFloat(item.value)) : parseInt(item.value)
    }));

    res.json({
      trends: formattedTrends,
      metric: metric,
      period: period
    });

  } catch (error) {
    logger.error('Error fetching trend data:', error);
    res.status(500).json({
      error: 'Failed to fetch trend data',
      message: error.message
    });
  }
});

module.exports = router;