async function main() {
	console.log(
		"Chainlink request to sender for validating Proof of Work"
	);
	const contractAddress = "0xf933c4323510ED7B518aEb7Ae4A0616DA8c86cb5";
	console.log("Getting Contract");
	const Handler = await ethers.getContractFactory("Handler");
	const handler = await Handler.attach(contractAddress);
	console.log("Linked with Handler contract deployed at", contractAddress);

    let result = await handler.getResult();
    console.log("Result before proof:", result);

	// call the validate proof function
	console.log("Making API request to oracle");
	const fetchTx = await handler.fetchProofOfWork();
	await fetchTx.wait();
	console.log("Transaction Mined, Request Made to Oracle");

	//wait 30 secs for oracle to callback
	console.log("Waiting for oracle to fulfill the response");
	await new Promise((resolve) => setTimeout(resolve, 30000));

    result = await handler.getResult();
    console.log("Result after proof:", result);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
