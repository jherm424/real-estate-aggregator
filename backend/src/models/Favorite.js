module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define('Favorite', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    listing_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'listings',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    notes: {
      type: DataTypes.TEXT,
      comment: 'User notes about this favorite listing'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'favorites',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'listing_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['listing_id']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  Favorite.associate = function(models) {
    Favorite.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    Favorite.belongsTo(models.Listing, {
      foreignKey: 'listing_id',
      as: 'listing'
    });
  };

  return Favorite;
};