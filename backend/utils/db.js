const mongoClient = require("mongodb").MongoClient;

const connect = (url, app) => {
	return mongoClient.connect(url);
};

// fetch user address specific exact streams
const fetchUserExactStreams = async (db, address) => {
	try {
		return db.collection("exact-streams").find({
			$or: [{from: address}, {to: address}],
		});
	} catch (error) {
		throw new Error("Unable to fetch streams");
	}
};

// fetch all active exact streams
const fetchActiveExactStreams = async (db) => {
	try {
		return db.collection("exact-streams").find({status: "active"});
	} catch (error) {
		throw new Error("Unable to fetch streams");
	}
};

const endExactStream = async (db, streamId) => {
	try {
		return db
			.collection("exact-streams")
			.updateOne({_id: streamId}, {$set: {status: "ended"}});
	} catch (error) {
		throw new Error("Unable to update stream status");
	}
};

module.exports = {
	connect,
	fetchUserExactStreams,
	fetchActiveExactStreams,
	endExactStream,
};
