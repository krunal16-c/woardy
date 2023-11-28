const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

async function databaseExists(dbName) {
    const query = `SHOW DATABASES LIKE '${dbName}'`;
    const results = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
    return results.length > 0;
  }

  const databaseFunctions = {
    databaseExists
  }

  module.exports = databaseFunctions