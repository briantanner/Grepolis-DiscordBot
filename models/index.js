'use strict';

let fs = require('fs'),
    path = require('path'),
    Sequelize = require('sequelize'),
    basename = path.basename(module.filename),
    db = {};

// load .env file if exists
if (fs.existsSync(path.join(process.env.PWD, '.env'))) {
  require('dotenv').load();
}

let sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialectOptions: {
    ssl: true
  },
  define: {
    timestamps: false
  }
});

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    let model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
