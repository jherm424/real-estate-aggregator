module.exports = (sequelize, DataTypes) => {
  const SavedSearch = sequelize.define('SavedSearch', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User-defined name for this saved search'
    },
    search_criteria: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Search filters and criteria as JSON object'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notify_new_results: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether to notify user of new matching listings'
    },
    last_notification_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'saved_searches',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['notify_new_results']
      }
    ]
  });

  SavedSearch.associate = function(models) {
    SavedSearch.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return SavedSearch;
};