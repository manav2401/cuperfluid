async function main() {
	console.log(
		"Chainlink Request Test, Should successfully make an external API request and get a result"
	);

	const contractAddress = "0xe8659Bc364b98373DdA52Bc30007d1C477F70Bd7";
	console.log("Getting Contract");

	const Handler = await ethers.getContractFactory("Handler");
	const handler = await Handler.attach(contractAddress);
	console.log("Linked with Handler contract deployed at", contractAddress);
	// should set the id to 0
	console.log("Setting ID to 0");
	const setIdTx = await handler.setId(0);
	await setIdTx.wait();
	console.log("Transaction Mined, ID set to 0");

	let id = await handler.getId();
	console.log("Fetched Id:", id);

	// call the fetch data function
	console.log("Making API request to oracle");
	const fetchDataTx = await handler.fetchData();
	await fetchDataTx.wait();
	console.log("Transaction Mined, Request Made to Oracle");

	//wait 30 secs for oracle to callback
	console.log("Waiting for oracle to fulfill the response");
	await new Promise((resolve) => setTimeout(resolve, 30000));

	id = await handler.getId();
	console.log("Fetched Id:", id);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
