const axios = require("axios");

const getHello = async (req, res) => {
  try {
    res.send({ message: response.data.data.getEpoch });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getHello };
