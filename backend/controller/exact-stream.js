// APIs for exact amount stream
const {Db} = require("mongodb");

/**
 *
 * @param {any} express
 * @param {Db} db
 */
function exactStream(express, db) {
	const router = express.Router();
	router.post("/exact-stream/start", (req, res) => {
		console.log("Request: ", req.body);
		/**
		 * from (string / address)
		 * to (string / address)
		 * token (string / address)
		 * flowrate (string / wei)
		 * startDate (string)
		 * endDate (string)
		 * metatx (object)
		 * status (string)
		 */
		db.collection("exact-streams").insertOne({
			...req.body,
		});
		res.send("Exact stream started");
	});

	router.get("/exact-streams", async (req, res) => {
		if (req.query.hasOwnProperty("address")) {
			try {
				const cursor = db.collection("exact-streams").find({
					$or: [{from: req.query.address}, {to: req.query.address}],
				});
				const response = [];
				await cursor.forEach((doc) => {
					const {metaTx, ...rest} = doc;
					response.push(rest);
				});
				res.status(200).json(response);
			} catch (error) {
				res.status(422).json({message: "Missing address"});
			}
		} else {
			res.status(422).json({message: "Missing address"});
		}
	});

	return router;
}

module.exports = exactStream;
