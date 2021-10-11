const ethers = require("ethers");
require("dotenv").config();
const {Biconomy} = require("@biconomy/mexa");

// artifacts
const SuperfluidArtifact = require("./../artifacts/@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol/ISuperfluid.json");
const CfaArtifact = require("./../artifacts/@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol/IConstantFlowAgreementV1.json");
const CuperfluidArtifact = require("../artifacts/contracts/Cuperfluid.sol/Cuperfluid.json");

const indexes = {
	0: "id",
	1: "sender",
	2: "receiver",
	3: "flowRate",
	4: "startTime",
	5: "numberOfCheckpoints",
	6: "checkpointInterval",
	7: "iteration",
	8: "proofOfWorkEndpoint",
	9: "accessToken",
	10: "tokenAddress",
	11: "isActive",
};

let endStream = false;

async function main() {
	console.log("Starting `Sender` Simulation");

	// constants
	const privateKey = process.env.PRIVATE_KEY || "";
	const apiKey = process.env.BICONOMY_API_KEY;
	const userAddress = "0x0997F9a8647CA45Ab697886143f4353C614e1D7A";
	const cuperfluidContractAddress =
		"0x921B1DBd4A075E9ad2686E480540F3a07C4A6553";
	const superfluidContractAddress =
		"0xEB796bdb90fFA0f28255275e16936D25d3418603";
	const cfaContractAddress = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";
	const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f";
	const receiver = "0xa5a782A2b2BE73421F75774186d4f8f1aAbca2C4";
	const flowRate = 385802469135802; // denotes tokens per sec, equates to 1010 tokens / month
	const numberOfCheckpoints = 10;
	const checkpointInterval = 60000;
	const endpoint = "https://secure-fortress-91179.herokuapp.com/validate";
	const token = "5c03fe67f60a8dcbc5df674f0a8df8f2";

	// provider and wallet
	const provider = new ethers.providers.JsonRpcProvider(
		"https://rpc-mumbai.maticvigil.com"
	);
	const wallet = new ethers.Wallet(privateKey, provider);

	// 1. Get the deployed cuperfluid contract
	console.log("Getting the Cuperfluid Deployed Contract");
	const cuperfluidContract = new ethers.Contract(
		cuperfluidContractAddress,
		CuperfluidArtifact.abi,
		wallet
	);
	console.log(
		"Linked with Cuperfluid contract deployed at",
		cuperfluidContractAddress
	);

	// 2. Create a new stream to contract address (from sender)
	// initialize the contract
	const superfluidContract = new ethers.Contract(
		superfluidContractAddress,
		SuperfluidArtifact.abi,
		wallet
	);
	const cfaInterface = new ethers.utils.Interface(CfaArtifact.abi);
	const createFlowSelector = cfaInterface.encodeFunctionData("createFlow", [
		fDAIx,
		receiver,
		flowRate,
		"0x",
	]);

	console.log("Creating a constant stream to the cuperfluid contract");
	console.log("Parameters...");
	console.log("`token`:", fDAIx);
	console.log(
		"`receiver`:",
		cuperfluidContractAddress,
		"(the cuperfluid contract)"
	);
	console.log("`flowRate`:", flowRate, "tokens/sec");
	console.log("UserData:", "0x");
	const tx = await superfluidContract.callAgreement(
		cfaContractAddress,
		createFlowSelector,
		"0x"
	);
	console.log("Waiting for transaction to mine");
	await tx.wait();
	console.log("Success: Created stream to cuperfluid contract");

	// 3. Call `createStream` method of cuperfluid contract
	// Biconomy Integration
	const biconomy = new Biconomy(provider, {apiKey: apiKey, debug: true});
	let ethersProvider = new ethers.providers.Web3Provider(biconomy);
	biconomy
		.onEvent(biconomy.READY, async () => {
			try {
				console.log("IN BICONOMY READY EVENT");
				const contract = new ethers.Contract(
					cuperfluidContractAddress,
					CuperfluidArtifact.abi,
					biconomy.getSignerByAddress(userAddress)
				);
				const contractInterface = new ethers.utils.Interface(
					CuperfluidArtifact.abi
				);
				console.log(
					"Calling `createStream` method of cuperfluid contract"
				);
				console.log("Parameters...");
				console.log("`receiver`:", receiver, "(the original receiver)");
				console.log("`flowRate`:", flowRate);
				console.log("`numberOfCheckpoints`:", numberOfCheckpoints);
				console.log("`checkpointInterval`:", checkpointInterval);
				console.log("`proofOfWorkEndpoint`:", endpoint);
				console.log("`accessToken`:", token);
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
					from: userAddress,
				};
				const signedTx = await wallet.signTransaction(rawTx);
				// should get user message to sign for EIP712 or personal signature types
				const forwardData =
					await biconomy.getForwardRequestAndMessageToSign(signedTx);
				// console.log(forwardData);

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

				const biconomyProvider = biconomy.getEthersProvider();
				// send signed transaction with ethers
				// promise resolves to transaction hash
				const txHash = await biconomyProvider.send(
					"eth_sendRawTransaction",
					[data]
				);
				console.log("Waiting for transaction to mine");
				const receipt = await biconomyProvider.waitForTransaction(
					txHash
				);
				console.log("Success: Created Cuperfluid Stream");
			} catch (error) {
				console.log("Error in biconomy execution:", error);
			}
		})
		.onEvent(biconomy.ERROR, (error, message) => {
			console.log("IN BICONOMY ERROR EVENT");
		});

	// 4. Add listeners
	// Stream Creation Event
	cuperfluidContract.on("StreamCreated", async (id, stream) => {
		try {
			console.log("New Stream Register to Cuperfluid Contract");
			console.log("Parameters...");
			console.log("`id`:", id);
			console.log("`stream`:", stream);
			checkForProofOfWork(cuperfluidContract, id, stream);
		} catch (error) {
			console.log("ERROR in Event StreamCreated Listener...", error);
		}
	});

	// Fetch Proof Of Work Event
	cuperfluidContract.on(
		"ProofOfWorkRequested",
		async (requestId, id, iteration) => {
			try {
				// On request, wait for 30 seconds for oracle to callback
				console.log("Waiting for oracle to fulfill the response");
				await new Promise((resolve) => setTimeout(resolve, 30000));

				// fetch the result from the request id
				// true => work done
				// false => work not done
				const result = await cuperfluidContract.fetchProofOfWorkResult(
					requestId
				);
				console.log(
					"Fetching Response for Previous Request...Result:",
					result
				);

				// fetch the stream at this moment to check it's status
				const stream = await cuperfluidContract.getStreamById(id);

				if (result == true && stream[11] == false) {
					// work done, but stream is inactive
					// activate the stream
					console.log("Valid Proof of Work, But Inactive Stream");
					console.log(
						"Activating the Stream (from contract to original receiver)"
					);
					const activateStreamTx =
						await cuperfluidContract.createSuperfluidStream(
							id,
							receiver,
							flowRate,
							fDAIx
						);
					await activateStreamTx.wait();
				} else if (result == false && stream[11] == true) {
					// work not done, but stream is active
					// deactivate the stream
					console.log("Invalid Proof of Work, But Active Stream");
					console.log(
						"Deactivating the Stream (from contract to original receiver)"
					);
					const deactivateStreamTx =
						await cuperfluidContract.deleteSuperfluidStream(
							id,
							receiver,
							fDAIx
						);
					await deactivateStreamTx.wait();
				} else {
					console.log(
						"No need to change stream...result:",
						result,
						", stream:",
						stream[11]
					);
				}
			} catch (error) {
				console.log(
					"ERROR in Event ProofOfWorkRequested Listener...",
					error
				);
			}
		}
	);

	// on stream activation (temporary)
	cuperfluidContract.on("StreamActivated", async (id) => {
		console.log("Stream with ID:", id, "activated!");
	});

	// on stream deactivation (temporary)
	cuperfluidContract.on("StreamDeactivated", async (id) => {
		console.log("Stream with ID:", id, "deactivated!");
	});

	// on stream deletion (permanant)
	cuperfluidContract.on("DeleteStream", async (id) => {
		try {
			// delete the stream
			console.log("All iterations finished...");
			endStream = true;

			// fetch the stream at this moment to check it's status
			const stream = await cuperfluidContract.getStreamById(id);

			// only delete if active
			if (stream.isActive == true) {
				console.log(
					"Deleting stream from contract to receiver (original)"
				);
				const deactivateStreamTx =
					await cuperfluidContract.deleteSuperfluidStream(
						id,
						receiver,
						fDAIx
					);
				await deactivateStreamTx.wait();
				console.log("Stream with ID:", id, "deleted!");
			}

			console.log("Deleting stream from sender to contract");
			const deleteFlowSelector = cfaInterface.encodeFunctionData(
				"deleteFlow",
				[fDAIx, userAddress, cuperfluidContractAddress, "0x"]
			);
			console.log("Deleting stream to the cuperfluid contract");
			console.log("Parameters...");
			console.log("`token`:", fDAIx);
			console.log("`sender`:", userAddress, "(the user)");
			console.log(
				"`receiver`:",
				cuperfluidContractAddress,
				"(the cuperfluid contract)"
			);
			console.log("UserData:", "0x");
			const deleteStreamTx = await superfluidContract.callAgreement(
				cfaContractAddress,
				deleteFlowSelector,
				"0x"
			);
			console.log("Waiting for transaction to mine");
			await deleteStreamTx.wait();
			console.log("Success: Deleted stream to cuperfluid contract");

			// TODO: refund the remaining funds from contract to the origin sender back
		} catch (error) {
			console.log("ERROR in Event DeleteStream Listener...", error);
		}
	});
}

async function checkForProofOfWork(cuperfluidContract, _id, _stream) {
	try {
		const checkpointInterval = parseInt(_stream[6]._hex, 16); // only get the interval for now
		console.log("The checkpoint interval is:", checkpointInterval);
		// const max = 12;
		// let stream = {};
		// for (let i = 0; i < max; i++) {
		// 	if (_stream[i]._isBigNumber === true) {
		// 		_stream[i] = parseInt(_stream[i]._hex, 16);
		// 	}
		// 	stream[indexes[i]] = _stream[i];
		// }

		// execute PoW checking logic after every `checkpointInterval` seconds
		console.log("About to begin checking the proof of work");
		let iteration = 0;

		const interval = setInterval(async () => {
			console.log("About to fetch proof of work:", iteration);
			if (endStream) {
				console.log("Ending Iterations...");
				clearInterval(interval);
			}
			// call `fetchProofOfWork` function
			let fetchPoWTx = await cuperfluidContract.fetchProofOfWork(_id);
			console.log("Waiting for transaction to mine");
			await fetchPoWTx.wait();
			console.log("Execution Complete, waiting for event listener");
			iteration++;
		}, checkpointInterval);
	} catch (error) {
		console.log("ERROR in CheckProofOfWork Function...", error);
	}
}

main()
	.then()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
