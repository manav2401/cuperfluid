const express = require("express");
const router = express.Router();

router.post("/stream/start", (req, res) => {
	res.send("Starting stream");
});

router.post("/stream/end", (req, res) => {
	res.send("Ending stream");
});

module.exports = router;
