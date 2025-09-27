const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    ...(dbConfig.ssl && {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Listing = require('./Listing')(sequelize, Sequelize);
db.User = require('./User')(sequelize, Sequelize);
db.Favorite = require('./Favorite')(sequelize, Sequelize);
db.SavedSearch = require('./SavedSearch')(sequelize, Sequelize);
db.ScrapingLog = require('./ScrapingLog')(sequelize, Sequelize);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;