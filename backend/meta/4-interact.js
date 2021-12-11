async function main() {
	const contractAddress = "0x88900e8190a2a6659dc9105C7e03c0De2e6d48fE";
	const Meta = await ethers.getContractFactory("Meta");
	const meta = await Meta.attach(contractAddress);
	console.log("Linked with Meta contract deployed at", contractAddress);
	let result = await meta.getNumber();
	console.log("Response:", result);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
