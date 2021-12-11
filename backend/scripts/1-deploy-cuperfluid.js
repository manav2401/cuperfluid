const hre = require("hardhat");

async function main() {
	const Cuperfluid = await hre.ethers.getContractFactory("Cuperfluid");
	const host = "0xEB796bdb90fFA0f28255275e16936D25d3418603";
	const cfa = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";
	const cuperfluid = await Cuperfluid.deploy(host, cfa);
	await cuperfluid.deployed();
	console.log("Cuperfluid deployed to: ", cuperfluid.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
