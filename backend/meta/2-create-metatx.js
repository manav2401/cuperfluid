const ethers = require("ethers");
require("dotenv").config();
const {Biconomy} = require("@biconomy/mexa");
const Meta = require("../artifacts/contracts/Meta.sol/Meta.json");

async function main() {
	const privateKey = process.env.PRIVATE_KEY;
	const apiKey = process.env.BICONOMY_API_KEY;
	const contractAddress = "0x88900e8190a2a6659dc9105C7e03c0De2e6d48fE";
	const address = "0x0997F9a8647CA45Ab697886143f4353C614e1D7A";
	const number = 10;
	const provider = new ethers.providers.JsonRpcProvider(
		"https://rpc-mumbai.maticvigil.com"
	);
	const wallet = new ethers.Wallet(privateKey, provider);
	const biconomy = new Biconomy(provider, {apiKey: apiKey, debug: true});
	biconomy
		.onEvent(biconomy.READY, async () => {
			try {
				console.log("IN BICONOMY READY EVENT...");
				const contractInterface = new ethers.utils.Interface(Meta.abi);
				const functionSignature = contractInterface.encodeFunctionData(
					"setNumber",
					[number]
				);
				const rawTx = {
					to: contractAddress,
					data: functionSignature,
					from: address,
				};
				const signedTx = await wallet.signTransaction(rawTx);
				console.log("signedTx:", signedTx);
				const forwardData =
					await biconomy.getForwardRequestAndMessageToSign(signedTx);
				const signature = await wallet.signMessage(
					forwardData.personalSignatureFormat
				);
				const data = {
					signature: signature,
					forwardRequest: forwardData.request,
					rawTransaction: signedTx,
					signatureType: biconomy.PERSONAL_SIGN, //optional. as mexa will assume personal signature by default this can be omitted
				};
				console.log("data:", data);
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

async function test1(provider, wallet) {
	const tx = {
		to: "0xa5a782A2b2BE73421F75774186d4f8f1aAbca2C4",
		value: ethers.utils.parseEther("0.1"),
		gasLimit: 21000,
		gasPrice: ethers.utils.parseUnits("10", "gwei"),
		nonce: await provider.getTransactionCount(wallet.address),
	};
	const signedTx = await wallet.signTransaction(tx);
	const result = await provider.sendTransaction(signedTx);
	console.log("result:", result);
	const receipt = await provider.getTransactionReceipt(result.hash);
	console.log("receipt:", receipt);
	console.log("Send Ethers Transaction Sent...");
}

main()
	.then()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
