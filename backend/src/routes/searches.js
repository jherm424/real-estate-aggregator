const express = require('express');
const { SavedSearch, User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const savedSearches = await SavedSearch.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      order: [['created_at', 'DESC']],
      attributes: {
        exclude: ['user_id']
      }
    });

    res.json({
      saved_searches: savedSearches
    });

  } catch (error) {
    logger.error('Error fetching saved searches:', error);
    res.status(500).json({
      error: 'Failed to fetch saved searches',
      message: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, name, search_criteria, notify_new_results = false } = req.body;

    if (!user_id || !name || !search_criteria) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'user_id, name, and search_criteria are required'
      });
    }

    if (typeof search_criteria !== 'object') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'search_criteria must be a valid JSON object'
      });
    }

    const existingSearch = await SavedSearch.findOne({
      where: {
        user_id,
        name,
        is_active: true
      }
    });

    if (existingSearch) {
      return res.status(409).json({
        error: 'Duplicate name',
        message: 'You already have a saved search with this name'
      });
    }

    const savedSearch = await SavedSearch.create({
      user_id,
      name,
      search_criteria,
      notify_new_results,
      is_active: true
    });

    res.status(201).json({
      message: 'Search saved successfully',
      saved_search: savedSearch
    });

  } catch (error) {
    logger.error('Error saving search:', error);
    res.status(500).json({
      error: 'Failed to save search',
      message: error.message
    });
  }
});

router.put('/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    const { name, search_criteria, notify_new_results } = req.body;

    const savedSearch = await SavedSearch.findByPk(searchId);

    if (!savedSearch) {
      return res.status(404).json({
        error: 'Search not found',
        message: `No saved search found with ID: ${searchId}`
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (search_criteria !== undefined) {
      if (typeof search_criteria !== 'object') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'search_criteria must be a valid JSON object'
        });
      }
      updateData.search_criteria = search_criteria;
    }
    if (notify_new_results !== undefined) updateData.notify_new_results = notify_new_results;

    if (name) {
      const existingSearch = await SavedSearch.findOne({
        where: {
          user_id: savedSearch.user_id,
          name,
          is_active: true,
          id: { [require('sequelize').Op.ne]: searchId }
        }
      });

      if (existingSearch) {
        return res.status(409).json({
          error: 'Duplicate name',
          message: 'You already have a saved search with this name'
        });
      }
    }

    await savedSearch.update(updateData);

    res.json({
      message: 'Search updated successfully',
      saved_search: savedSearch
    });

  } catch (error) {
    logger.error('Error updating saved search:', error);
    res.status(500).json({
      error: 'Failed to update search',
      message: error.message
    });
  }
});

router.delete('/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;

    const savedSearch = await SavedSearch.findByPk(searchId);

    if (!savedSearch) {
      return res.status(404).json({
        error: 'Search not found',
        message: `No saved search found with ID: ${searchId}`
      });
    }

    await savedSearch.update({ is_active: false });

    res.json({
      message: 'Search deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting saved search:', error);
    res.status(500).json({
      error: 'Failed to delete search',
      message: error.message
    });
  }
});

router.get('/:searchId/execute', async (req, res) => {
  try {
    const { searchId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const savedSearch = await SavedSearch.findByPk(searchId);

    if (!savedSearch) {
      return res.status(404).json({
        error: 'Search not found',
        message: `No saved search found with ID: ${searchId}`
      });
    }

    const criteria = savedSearch.search_criteria;
    const queryParams = new URLSearchParams();

    if (criteria.source) queryParams.append('source', criteria.source);
    if (criteria.listing_type) queryParams.append('listing_type', criteria.listing_type);
    if (criteria.property_type) queryParams.append('property_type', criteria.property_type);
    if (criteria.city) queryParams.append('city', criteria.city);
    if (criteria.province) queryParams.append('province', criteria.province);
    if (criteria.price_min) queryParams.append('price_min', criteria.price_min);
    if (criteria.price_max) queryParams.append('price_max', criteria.price_max);
    if (criteria.bedrooms) queryParams.append('bedrooms', criteria.bedrooms);
    if (criteria.bathrooms) queryParams.append('bathrooms', criteria.bathrooms);
    if (criteria.square_feet_min) queryParams.append('square_feet_min', criteria.square_feet_min);
    if (criteria.square_feet_max) queryParams.append('square_feet_max', criteria.square_feet_max);

    queryParams.append('page', page);
    queryParams.append('limit', limit);

    const listingsRouter = require('./listings');
    req.query = Object.fromEntries(queryParams);

    const mockRes = {
      json: (data) => {
        res.json({
          saved_search: {
            id: savedSearch.id,
            name: savedSearch.name,
            search_criteria: savedSearch.search_criteria
          },
          results: data
        });
      },
      status: (code) => ({
        json: (data) => res.status(code).json(data)
      })
    };

    const listingsController = listingsRouter.stack.find(layer =>
      layer.route && layer.route.path === '/' && layer.route.methods.get
    );

    if (listingsController) {
      await listingsController.route.stack[0].handle(req, mockRes);
    } else {
      throw new Error('Listings controller not found');
    }

  } catch (error) {
    logger.error('Error executing saved search:', error);
    res.status(500).json({
      error: 'Failed to execute search',
      message: error.message
    });
  }
});

module.exports = router;