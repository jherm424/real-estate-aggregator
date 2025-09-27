module.exports = (sequelize, DataTypes) => {
  const Listing = sequelize.define('Listing', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    external_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'External ID from the source website'
    },
    source: {
      type: DataTypes.ENUM('realtor_ca', 'mls', 'kijiji', 'other'),
      allowNull: false,
      comment: 'Source website where listing was scraped from'
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Original URL of the listing'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    price_currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'CAD'
    },
    listing_type: {
      type: DataTypes.ENUM('rent', 'sale', 'lease'),
      allowNull: false
    },
    property_type: {
      type: DataTypes.ENUM('house', 'condo', 'townhouse', 'apartment', 'land', 'commercial', 'other'),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false
    },
    postal_code: {
      type: DataTypes.STRING
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8)
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8)
    },
    bedrooms: {
      type: DataTypes.INTEGER
    },
    bathrooms: {
      type: DataTypes.DECIMAL(3, 1)
    },
    square_feet: {
      type: DataTypes.INTEGER
    },
    lot_size: {
      type: DataTypes.DECIMAL(10, 2)
    },
    year_built: {
      type: DataTypes.INTEGER
    },
    parking: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of image URLs'
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of property features'
    },
    contact_info: {
      type: DataTypes.JSONB,
      comment: 'Contact information (agent, phone, email)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'sold', 'rented', 'expired'),
      defaultValue: 'active'
    },
    last_scraped_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    first_seen_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    removed_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'listings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['external_id', 'source']
      },
      {
        fields: ['source']
      },
      {
        fields: ['listing_type']
      },
      {
        fields: ['property_type']
      },
      {
        fields: ['city']
      },
      {
        fields: ['province']
      },
      {
        fields: ['price']
      },
      {
        fields: ['bedrooms']
      },
      {
        fields: ['bathrooms']
      },
      {
        fields: ['status']
      },
      {
        fields: ['last_scraped_at']
      },
      {
        name: 'listings_location_idx',
        fields: ['latitude', 'longitude']
      },
      {
        name: 'listings_price_range_idx',
        fields: ['price', 'listing_type']
      }
    ]
  });

  Listing.associate = function(models) {
    Listing.hasMany(models.Favorite, {
      foreignKey: 'listing_id',
      as: 'favorites'
    });
  };

  return Listing;
};