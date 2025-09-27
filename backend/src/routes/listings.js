const express = require('express');
const { Op } = require('sequelize');
const { Listing, Favorite } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      source,
      listing_type,
      property_type,
      city,
      province,
      price_min,
      price_max,
      bedrooms,
      bathrooms,
      square_feet_min,
      square_feet_max,
      sort_by = 'created_at',
      sort_order = 'DESC',
      status = 'active'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { status };

    if (source) whereClause.source = source;
    if (listing_type) whereClause.listing_type = listing_type;
    if (property_type) whereClause.property_type = property_type;
    if (city) whereClause.city = { [Op.iLike]: `%${city}%` };
    if (province) whereClause.province = province;

    if (price_min || price_max) {
      whereClause.price = {};
      if (price_min) whereClause.price[Op.gte] = parseFloat(price_min);
      if (price_max) whereClause.price[Op.lte] = parseFloat(price_max);
    }

    if (bedrooms) {
      whereClause.bedrooms = parseInt(bedrooms);
    }

    if (bathrooms) {
      whereClause.bathrooms = { [Op.gte]: parseFloat(bathrooms) };
    }

    if (square_feet_min || square_feet_max) {
      whereClause.square_feet = {};
      if (square_feet_min) whereClause.square_feet[Op.gte] = parseInt(square_feet_min);
      if (square_feet_max) whereClause.square_feet[Op.lte] = parseInt(square_feet_max);
    }

    const orderClause = [[sort_by, sort_order.toUpperCase()]];

    const { count, rows: listings } = await Listing.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: orderClause,
      attributes: {
        exclude: ['created_at', 'updated_at']
      }
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      listings,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_count: count,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters_applied: {
        source,
        listing_type,
        property_type,
        city,
        province,
        price_range: price_min || price_max ? { min: price_min, max: price_max } : null,
        bedrooms,
        bathrooms,
        square_feet_range: square_feet_min || square_feet_max ? { min: square_feet_min, max: square_feet_max } : null
      }
    });

  } catch (error) {
    logger.error('Error fetching listings:', error);
    res.status(500).json({
      error: 'Failed to fetch listings',
      message: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByPk(id, {
      attributes: {
        exclude: ['created_at', 'updated_at']
      }
    });

    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found',
        message: `No listing found with ID: ${id}`
      });
    }

    res.json({ listing });

  } catch (error) {
    logger.error('Error fetching listing:', error);
    res.status(500).json({
      error: 'Failed to fetch listing',
      message: error.message
    });
  }
});

router.get('/search/suggest', async (req, res) => {
  try {
    const { q, type = 'city' } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    let suggestions = [];

    if (type === 'city') {
      const cities = await Listing.findAll({
        attributes: ['city'],
        where: {
          city: { [Op.iLike]: `%${q}%` },
          status: 'active'
        },
        group: ['city'],
        limit: 10,
        raw: true
      });
      suggestions = cities.map(item => item.city);
    }

    if (type === 'address') {
      const addresses = await Listing.findAll({
        attributes: ['address'],
        where: {
          address: { [Op.iLike]: `%${q}%` },
          status: 'active'
        },
        limit: 10,
        raw: true
      });
      suggestions = addresses.map(item => item.address);
    }

    res.json({ suggestions: [...new Set(suggestions)] });

  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: error.message
    });
  }
});

router.get('/filters/options', async (req, res) => {
  try {
    const [cities, propertyTypes, sources] = await Promise.all([
      Listing.findAll({
        attributes: ['city'],
        where: { status: 'active' },
        group: ['city'],
        order: [['city', 'ASC']],
        raw: true
      }),
      Listing.findAll({
        attributes: ['property_type'],
        where: { status: 'active' },
        group: ['property_type'],
        order: [['property_type', 'ASC']],
        raw: true
      }),
      Listing.findAll({
        attributes: ['source'],
        where: { status: 'active' },
        group: ['source'],
        order: [['source', 'ASC']],
        raw: true
      })
    ]);

    const priceRanges = [
      { label: 'Under $1,000', min: 0, max: 1000 },
      { label: '$1,000 - $1,500', min: 1000, max: 1500 },
      { label: '$1,500 - $2,000', min: 1500, max: 2000 },
      { label: '$2,000 - $2,500', min: 2000, max: 2500 },
      { label: '$2,500 - $3,000', min: 2500, max: 3000 },
      { label: 'Over $3,000', min: 3000, max: null }
    ];

    res.json({
      cities: cities.map(item => item.city),
      property_types: propertyTypes.map(item => item.property_type),
      sources: sources.map(item => item.source),
      listing_types: ['rent', 'sale', 'lease'],
      bedrooms: [1, 2, 3, 4, 5, '6+'],
      bathrooms: [1, 1.5, 2, 2.5, 3, '3.5+'],
      price_ranges: priceRanges
    });

  } catch (error) {
    logger.error('Error fetching filter options:', error);
    res.status(500).json({
      error: 'Failed to fetch filter options',
      message: error.message
    });
  }
});

module.exports = router;