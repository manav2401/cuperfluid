const hre = require("hardhat");

async function main() {
	const Meta = await hre.ethers.getContractFactory("Meta");
	const meta = await Meta.deploy();
	await meta.deployed();
	console.log("Meta deployed to: ", meta.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
