module.exports = (sequelize, DataTypes) => {
  const ScrapingLog = sequelize.define('ScrapingLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    source: {
      type: DataTypes.ENUM('realtor_ca', 'mls', 'kijiji', 'other'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('started', 'completed', 'failed', 'cancelled'),
      allowNull: false
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      comment: 'Duration of scraping session in seconds'
    },
    listings_found: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total listings found during this scraping session'
    },
    listings_new: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'New listings added during this session'
    },
    listings_updated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Existing listings updated during this session'
    },
    listings_removed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Listings marked as removed/inactive'
    },
    errors: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of errors encountered during scraping'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional metadata about the scraping session'
    }
  }, {
    tableName: 'scraping_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['source']
      },
      {
        fields: ['status']
      },
      {
        fields: ['started_at']
      },
      {
        fields: ['completed_at']
      }
    ]
  });

  return ScrapingLog;
};