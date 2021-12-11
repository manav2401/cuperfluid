const ethers = require("ethers");
require("dotenv").config();
// const {Superfluid} = require("./abis")
const SuperfluidArtifact = require("./../artifacts/@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol/ISuperfluid.json");
const CfaArtifact = require("../artifacts/@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol/IConstantFlowAgreementV1.json");

async function main() {
	const privateKey = process.env.PRIVATE_KEY;
	const provider = new ethers.providers.JsonRpcProvider(
		"https://rpc-mumbai.maticvigil.com"
	);
	const wallet = new ethers.Wallet(privateKey, provider);
	const Superfluid = new ethers.Contract(
		"0xEB796bdb90fFA0f28255275e16936D25d3418603",
		SuperfluidArtifact.abi,
		wallet
	);
	const Cfa = new ethers.Contract(
		"0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873",
		CfaArtifact.abi,
		wallet
	);
	// const abiCoder = new ethers.utils.AbiCoder();
	// abiCoder.encode(["string", "string"])
	const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f";
	const receiver = "0xdA7773E91a396d592AD33146164dA6d7d2Fda9B6";
	const flowRate = 385802469135802;
	const superfluidInterface = new ethers.utils.Interface(CfaArtifact.abi);
	const selector = superfluidInterface.encodeFunctionData("createFlow", [fDAIx, receiver, flowRate, "0x"]);
	
	const tx = await Superfluid.callAgreement("0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873", selector, "0x")
	console.log("hash:",tx.hash);
	await tx.wait();
	console.log("finally.......done!!!")
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
