require("dotenv").config();
const ethers = require("ethers");
const {Biconomy} = require("@biconomy/mexa");

const sendMetaTransaction = async () => {
	const privateKey = process.env.TEST_PRIVATE_KEY;
	const apiKey = process.env.BICONOMY_API_KEY;
	const rpcUrl = process.env.RPC_URL;
	const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
	const biconomy = new Biconomy(provider, {apiKey: apiKey, debug: true});
  let error = false;
	biconomy
		.onEvent(biconomy.READY, async () => {
			try {
				console.log("IN BICONOMY READY EVENT...");
				const biconomyProvider = biconomy.getEthersProvider();
				const txHash = await biconomyProvider.send(
					"eth_sendRawTransaction",
					[data]
				);
				console.log("Waiting for transaction to mine");
				const receipt = await biconomyProvider.waitForTransaction(
					txHash
				);
				console.log("Transaction mined...", "receipt:", receipt);
			} catch (error) {
				console.log("Error in sending meta transaction", error);
				throw new Error("Error in sending meta transaction");
			}
		})
		.onEvent(biconomy.ERROR, (error, message) => {
			console.log("Error in configuring biconomy", error, message);
			throw new Error("Error in configuring biconomy");
		});
	console.log("Waiting to fulfill the response");
	await new Promise((resolve) => setTimeout(resolve, 30000));
};

module.exports = sendMetaTransaction;
