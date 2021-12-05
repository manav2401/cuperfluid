const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(handleCORSRequests);
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);
app.use(bodyParser.json());

app.use("/", require("./controller/controller"));

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});

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
