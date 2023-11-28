const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: process.env.DATABASE_HOST ||'localhost',
  username: 'root',
  password: "root",
  database: 'test_db',
  dialect: "mysql",
  socketPath: '/var/run/mysqld/mysqld.sock'
});

module.exports = sequelize;
