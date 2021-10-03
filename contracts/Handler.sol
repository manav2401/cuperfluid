//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;

import "@chainlink/contracts/src/v0.7/ChainlinkClient.sol";

// import "https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.7/ChainlinkClient.sol";

contract Handler is ChainlinkClient {
	using Chainlink for Chainlink.Request;

	uint256 public id;
	bool public result;

	// chainlink params
	address private oracle;
	bytes32 private jobId;
	uint256 private fee;

	/**
	 * Network: Polygon Mumbai Testnet
	 * Oracle: 0x58bbdbfb6fca3129b91f0dbe372098123b38b5e9
	 * Job ID: 999539ec63414233bdc989d8a8ff10aa (bool)
	 * LINK address: 0x326C977E6efc84E512bB9C30f76E30c160eD06FB
	 * Fee: 0.01 LINK
	 */
	constructor() public {
		id = 0;
		result = false;
		setChainlinkToken(
			(address(0x326C977E6efc84E512bB9C30f76E30c160eD06FB))
		);
		oracle = address(0x58BBDbfb6fca3129b91f0DBE372098123B38B5e9);
		jobId = "999539ec63414233bdc989d8a8ff10aa";
		fee = 10**16; // 0.01 LINK
	}

	/**
	 * Create a chainlink request to fetch data from API
	 */
	function fetchData() public returns (bytes32 requestId) {
		Chainlink.Request memory request = buildChainlinkRequest(
			jobId,
			address(this),
			this.fulfill.selector
		);
		// Set the URL to perform the GET request on
		// NOTE: If this oracle gets more than 5 requests from this job at a time, it will not return.
		request.add("get", "https://jsonplaceholder.typicode.com/todos/2"); // dummy api
		string[] memory path = new string[](1);
		path[0] = "id";
		request.addStringArray("path", path);
		return sendChainlinkRequestTo(oracle, request, fee);
	}

	/**
	 * Fetch Proof Of Work
	 */
	function fetchProofOfWork() public returns (bytes32 requestId) {
		Chainlink.Request memory request = buildChainlinkRequest(
			jobId,
			address(this),
			this.fulfill.selector
		);
		// Set the URL to perform the GET request on
		// NOTE: If this oracle gets more than 5 requests from this job at a time, it will not return.
		// replace the sender's server url here
		request.add(
			"get",
			"https://secure-fortress-91179.herokuapp.com/validate?token=5c03fe67f60a8dcbc5df674f0a8df8f2&from=1&to=1"
		);
		return sendChainlinkRequestTo(oracle, request, fee);
	}

	/**
	 * Receive the response in the form of bool
	 */
	function fulfill(bytes32 _requestId, bool _result)
		public
		recordChainlinkFulfillment(_requestId)
	{
		result = _result;
	}

	function getResult() public view returns (bool) {
		return result;
	}

	function setId(uint256 _id) public returns (uint256) {
		id = _id;
		return id;
	}

	function getId() public view returns (uint256) {
		return id;
	}
}
