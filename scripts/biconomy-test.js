const ethers = require("ethers");
require("dotenv").config();
const {Biconomy} = require("@biconomy/mexa");
const Cuperfluid = require("../artifacts/contracts/Cuperfluid.sol/Cuperfluid.json");

async function main() {
	const privateKey = process.env.PRIVATE_KEY;
	const apiKey = process.env.BICONOMY_API_KEY;
	const cuperfluidContractAddress = process.env.CUPERFLUID_CONTRACT_ADDRESS;
	const userAddress = process.env.USER_ADDRESS;
	const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f";
	const receiver = "0xdA7773E91a396d592AD33146164dA6d7d2Fda9B6";
	const flowRate = 385802469135802;
	const numberOfCheckpoints = 10;
	const checkpointInterval = 3600;
	const endpoint =
		process.env.BACKEND_ENDPOINT ||
		"https://secure-fortress-91179.herokuapp.com/validate";
	const token = "5c03fe67f60a8dcbc5df674f0a8df8f2";
	const address = process.env.USER_ADDRESS;

	const provider = new ethers.providers.JsonRpcProvider(
		"https://rpc-mumbai.maticvigil.com"
	);
	const wallet = new ethers.Wallet(privateKey, provider);
	const biconomy = new Biconomy(provider, {apiKey: apiKey, debug: true});
	let ethersProvider = new ethers.providers.Web3Provider(biconomy);
	biconomy
		.onEvent(biconomy.READY, async () => {
			try {
				console.log("in ready....");
				// Initialize Constants
				const contract = new ethers.Contract(
					cuperfluidContractAddress,
					Cuperfluid.abi,
					biconomy.getSignerByAddress(address)
				);

				const contractInterface = new ethers.utils.Interface(
					Cuperfluid.abi
				);

				const functionSignature = contractInterface.encodeFunctionData(
					"createStream",
					[
						receiver,
						flowRate,
						numberOfCheckpoints,
						checkpointInterval,
						endpoint,
						token,
					]
				);
				const rawTx = {
					to: cuperfluidContractAddress,
					data: functionSignature,
					from: address,
				};
				const signedTx = await wallet.signTransaction(rawTx);
				// should get user message to sign for EIP712 or personal signature types
				const forwardData =
					await biconomy.getForwardRequestAndMessageToSign(signedTx);
				console.log(forwardData);

				// optionally one can sign using sigUtil
				const signature = await wallet.signMessage(
					forwardData.personalSignatureFormat
				);

				const data = {
					signature: signature,
					forwardRequest: forwardData.request,
					rawTransaction: signedTx,
					signatureType: biconomy.PERSONAL_SIGN, //optional. as mexa will assume personal signature by default this can be omitted
				};

				const provider = biconomy.getEthersProvider();
				// send signed transaction with ethers
				// promise resolves to transaction hash
				const txHash = await provider.send("eth_sendRawTransaction", [
					data,
				]);

				const receipt = await provider.waitForTransaction(txHash);
				console.log("finally....done!!!");
			} catch (error) {
				console.log("in catch...", error);
			}
		})
		.onEvent(biconomy.ERROR, (error, message) => {
			console.log("IN ERROR EVENT");
		});

	console.log("Waiting to fulfill the response");
	// await new Promise((resolve) => setTimeout(resolve, 120000));
}

main()
	.then()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
