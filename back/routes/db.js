const express = require("express");
const { Sequelize } = require("sequelize");

const router = express.Router();
const sequelize = require("../config/database");
const PostsModel = require("../models/Posts.model");
const databaseFunctions = require("../utils/db");

const NewDbConnection = ({ dbUser, dbPassword, dbName }) => {
  try {
    const Database = new Sequelize({
      host: process.env.DATABASE_HOST ||'localhost',
      username: 'root',
      password: "root",
      database: dbName,
      dialect: "mysql",
      socketPath: '/var/run/mysqld/mysqld.sock'
    });
    return Database;
  } catch (error) {
    console.log(error)
  }
};

router.post("/", async (req, res) => {
  const { dbName, dbUser, dbPassword } = req.body;
  try {
    const databaseExists = await databaseFunctions.databaseExists(dbName);
    if (!databaseExists) {
      await sequelize.query(`CREATE DATABASE ${dbName}`);
      const newDbConnection = NewDbConnection({ dbUser, dbPassword, dbName });
      newDbConnection.define("posts", PostsModel);

      await newDbConnection.sync();
      res
        .status(201)
        .json({
          message: "db and table is created successfully",
          dbName,
          dbUser,
          dbPassword,
        });
    } else {
      const newDbConnection = NewDbConnection({ dbUser, dbPassword, dbName });
      newDbConnection.query("DELETE FROM posts");
      res
        .status(200)
        .json({
          message: "database already exists, table is cleared successfully",
          dbName,
          dbUser,
          dbPassword,
        });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "something went wrong", error: error.message });
  }
});

router.post("/create", async (req, res) => {
    const { dbName, dbUser, dbPassword,topic,data } = req.body;
    try {
        const newDbConnection = NewDbConnection({ dbUser, dbPassword, dbName });
        newDbConnection.define("posts", PostsModel);
        const Model = newDbConnection.models["posts"];
        await Model.create({topic,data})
        res.status(200).json({message:'post created successfully' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
});
router.get("/:dbName/:dbUser/:dbPassword", async (req, res) => {
  const { dbName, dbUser, dbPassword } = req.params;
  try {
    const newDbConnection = NewDbConnection({ dbUser, dbPassword, dbName });
    newDbConnection.define("posts", PostsModel);
    const Model = newDbConnection.models["posts"];
    const posts =await Model.findAll()
    res.status(200).json({ data:posts });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
