const mongoClient = require("mongodb").MongoClient;

const connect = (url, app) => {
  return mongoClient.connect(url)
}

module.exports = connect;