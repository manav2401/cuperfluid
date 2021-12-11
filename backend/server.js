require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const {connect} = require("./utils/db");
const {checkExactStreams} = require("./services/exact-stream");
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL || "mongodb://localhost:27017/cuperfluid";

const app = express();
app.use(cors());
app.use(handleCORSRequests);
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);
app.use(bodyParser.json());

const start = async () => {
	try {
		connect(DB_URL).then((client) => {
			console.log("🚀 Connected to DB...");
			const db = client.db(process.env.DB_NAME || "cuperfluid");
			const exactStream = require("./controller/exact-stream")(
				express,
				db
			);
			app.use("/", exactStream);
			checkExactStreams(db);
		});
	} catch (err) {
		console.log("❌ Error occured while connecting to DB...");
	}

	app.listen(PORT, () => console.log(`🚀 Server started on PORT: ${PORT}`));
};

// add header parameters to every request object
function handleCORSRequests(req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"X-Requested-With, content-type, Authorization"
	);
	next();
}

module.exports = {start};
