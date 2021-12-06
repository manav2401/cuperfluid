require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const connect = require("./utils/db");
// const typeDefs = require("./graphql/typeDefs");
// const resolvers = require("./graphql/resolvers");
const { getHello } = require("./controller/hello");
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DB_URL || "mongodb://localhost:27017/cuperfluid-backend";
axios.defaults.baseURL = process.env.BASE_URL || `http://localhost:${PORT}`;

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => res.send("Hello World!!!"));

app.get("/hello", getHello);

const start = async () => {
  try {
    connect(DB_URL).then(() => console.log("🚀 Connected to DB..."));
  } catch (err) {
    console.log("❌ Error occured while connecting to DB...");
  }

  app.listen(PORT, () =>
    console.log(
      `🚀 Server started on PORT: ${PORT}`
    )
  );
};

module.exports = { start };
