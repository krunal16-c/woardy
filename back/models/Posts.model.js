const Sequelize = require('sequelize');

const PostsModel = {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  topic: {
    type: Sequelize.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  data: {
    type: Sequelize.TEXT("long"),
    allowNull: false,
  }  
}

module.exports = PostsModel;
