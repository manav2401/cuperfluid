const ethers = require("ethers");
require("dotenv").config();
const {Biconomy} = require("@biconomy/mexa");

async function main() {
	const privateKey = process.env.TEST_PRIVATE_KEY;
	const apiKey = process.env.BICONOMY_API_KEY;
	const data = {
		signature:
			"0x0a524355d6fa67f4eb828656c2ce17b569aaba93bd95aae84fc8f662934a2f646e5bdd8dbd1eedc7604bc6b726b6e80dfebc432a48f05bf2201bd587cc3413021c",
		forwardRequest: {
			from: "0x0997F9a8647CA45Ab697886143f4353C614e1D7A",
			to: "0x88900e8190a2a6659dc9105c7e03c0de2e6d48fe",
			token: "0x0000000000000000000000000000000000000000",
			txGas: 51095,
			tokenGasPrice: "0",
			batchId: 0,
			batchNonce: 12,
			deadline: 1638386969,
			data: "0x3fb5c1cb000000000000000000000000000000000000000000000000000000000000000a",
		},
		rawTransaction:
			"0xf8818080809488900e8190a2a6659dc9105c7e03c0de2e6d48fe80a43fb5c1cb000000000000000000000000000000000000000000000000000000000000000a1ba040b584ae30278910d2e1190aa5a7f8836e07435069d038137b1d0e40c8d83c9da0187bb5b21c6eb62cac94f6162998e5286c7e62181c7172b46a63f795a1e48c80",
		signatureType: "PERSONAL_SIGN",
	};
	const provider = new ethers.providers.JsonRpcProvider(
		"https://rpc-mumbai.maticvigil.com"
	);
	const wallet = new ethers.Wallet(privateKey, provider);
	const biconomy = new Biconomy(provider, {apiKey: apiKey, debug: true});
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
				console.log("Success...");
			} catch (error) {
				console.log("in catch...", error);
			}
		})
		.onEvent(biconomy.ERROR, (error, message) => {
			console.log("IN ERROR EVENT");
		});
	console.log("Waiting to fulfill the response");
	await new Promise((resolve) => setTimeout(resolve, 30000));
}

main()
	.then()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
