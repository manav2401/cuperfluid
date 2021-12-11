const {fetchActiveExactStreams, endExactStream} = require("./../utils/db");
const sendMetaTransaction = require("./../utils/metatx");

const checkExactStreams = async (db) => {
	// fixed time implementation
	let delay = 5 * 60 * 1000; // 5 min default delay between checks
	let interval = setInterval(async () => {
		console.log("Starting to check all exact streams");
		try {
			const cursor = await fetchActiveExactStreams(db);
			const time = new Date.now();
			await cursor.forEach((doc) => {
				const endDate = doc.endDate;
				// check if end date is in the past
				if (endDate && endDate < time) {
					// end the stream by sending the meta transaction
					sendMetaTransaction(doc.metaTx);
					// update db
					endExactStream(db, doc._id);
				}
			});
		} catch (error) {
			console.log("Error in checkExactStreams", error);
		}
	}, delay);
};

// for testing a demo scenario
const test = () => {
	console.log("in test...");
	let count = 0;
	let time = 1000;

	const test2 = () => {
		count++;
		if (count % 5 == 0) {
			clearInterval(interval);
			time = 5000;
			interval = setInterval(test2, time);
		} else if (count % 5 == 1) {
			clearInterval(interval);
			time = 1000;
			interval = setInterval(test2, time);
		}
		console.log("in test2...", "count", count);
	};
	let interval = setInterval(test2, time);
};

module.exports = {checkExactStreams, test};
