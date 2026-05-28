const { Sequelize } = require('sequelize');

const isDocker = !!process.env.DATABASE_HOST && process.env.DATABASE_HOST !== 'localhost';

const sequelize = new Sequelize({
  host: process.env.DATABASE_HOST || 'localhost',
  username: 'root',
  password: 'root',
  database: 'test_db',
  dialect: 'mysql',
  logging: false,
  ...(isDocker ? {} : { socketPath: '/var/run/mysqld/mysqld.sock' }),
});

module.exports = sequelize;
