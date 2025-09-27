const express = require('express');
const { Favorite, Listing, User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: {
        user_id: userId,
        is_active: true
      },
      include: [{
        model: Listing,
        as: 'listing',
        where: { status: 'active' },
        attributes: {
          exclude: ['created_at', 'updated_at']
        }
      }],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'notes', 'created_at']
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      favorites,
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
    logger.error('Error fetching favorites:', error);
    res.status(500).json({
      error: 'Failed to fetch favorites',
      message: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, listing_id, notes } = req.body;

    if (!user_id || !listing_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'user_id and listing_id are required'
      });
    }

    const listing = await Listing.findByPk(listing_id);
    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found',
        message: `No listing found with ID: ${listing_id}`
      });
    }

    const existingFavorite = await Favorite.findOne({
      where: {
        user_id,
        listing_id
      }
    });

    if (existingFavorite) {
      if (existingFavorite.is_active) {
        return res.status(409).json({
          error: 'Already favorited',
          message: 'This listing is already in your favorites'
        });
      } else {
        await existingFavorite.update({
          is_active: true,
          notes: notes || existingFavorite.notes
        });

        const updatedFavorite = await Favorite.findByPk(existingFavorite.id, {
          include: [{
            model: Listing,
            as: 'listing',
            attributes: {
              exclude: ['created_at', 'updated_at']
            }
          }]
        });

        return res.status(200).json({
          message: 'Favorite restored successfully',
          favorite: updatedFavorite
        });
      }
    }

    const favorite = await Favorite.create({
      user_id,
      listing_id,
      notes,
      is_active: true
    });

    const createdFavorite = await Favorite.findByPk(favorite.id, {
      include: [{
        model: Listing,
        as: 'listing',
        attributes: {
          exclude: ['created_at', 'updated_at']
        }
      }]
    });

    res.status(201).json({
      message: 'Favorite added successfully',
      favorite: createdFavorite
    });

  } catch (error) {
    logger.error('Error adding favorite:', error);
    res.status(500).json({
      error: 'Failed to add favorite',
      message: error.message
    });
  }
});

router.put('/:favoriteId', async (req, res) => {
  try {
    const { favoriteId } = req.params;
    const { notes } = req.body;

    const favorite = await Favorite.findByPk(favoriteId, {
      include: [{
        model: Listing,
        as: 'listing'
      }]
    });

    if (!favorite) {
      return res.status(404).json({
        error: 'Favorite not found',
        message: `No favorite found with ID: ${favoriteId}`
      });
    }

    await favorite.update({ notes });

    const updatedFavorite = await Favorite.findByPk(favoriteId, {
      include: [{
        model: Listing,
        as: 'listing',
        attributes: {
          exclude: ['created_at', 'updated_at']
        }
      }]
    });

    res.json({
      message: 'Favorite updated successfully',
      favorite: updatedFavorite
    });

  } catch (error) {
    logger.error('Error updating favorite:', error);
    res.status(500).json({
      error: 'Failed to update favorite',
      message: error.message
    });
  }
});

router.delete('/:favoriteId', async (req, res) => {
  try {
    const { favoriteId } = req.params;

    const favorite = await Favorite.findByPk(favoriteId);

    if (!favorite) {
      return res.status(404).json({
        error: 'Favorite not found',
        message: `No favorite found with ID: ${favoriteId}`
      });
    }

    await favorite.update({ is_active: false });

    res.json({
      message: 'Favorite removed successfully'
    });

  } catch (error) {
    logger.error('Error removing favorite:', error);
    res.status(500).json({
      error: 'Failed to remove favorite',
      message: error.message
    });
  }
});

router.get('/check/:userId/:listingId', async (req, res) => {
  try {
    const { userId, listingId } = req.params;

    const favorite = await Favorite.findOne({
      where: {
        user_id: userId,
        listing_id: listingId,
        is_active: true
      }
    });

    res.json({
      is_favorited: !!favorite,
      favorite_id: favorite ? favorite.id : null
    });

  } catch (error) {
    logger.error('Error checking favorite status:', error);
    res.status(500).json({
      error: 'Failed to check favorite status',
      message: error.message
    });
  }
});

module.exports = router;