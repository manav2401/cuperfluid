//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;

import "@chainlink/contracts/src/v0.7/ChainlinkClient.sol";

// import "https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.7/ChainlinkClient.sol";

contract Handler is ChainlinkClient {
	using Chainlink for Chainlink.Request;

	// solhint-disable-next-line state-visibility
	address constant SUPERDAI = address(0);

	uint256 public id;

	// cuperfluid stream object
	struct Stream {
		uint96 id;
		address sender;
		address receiver;
		int96 flowRate;
		uint96 startTime;
		uint96 numberOfCheckpoints;
		uint96 checkpointInterval;
		uint96 iteration;
		string proofOfWorkEndpoint;
		string accessToken;
		address tokenAddress;
		bool isActive;
	}
	// Stream id to Stream object mapping
	mapping(uint96 => Stream) private streams;
	// Stream id to Checkpoint Iteration to RequestId mapping
	mapping(uint96 => mapping(uint96 => bytes32)) private requests;
	// RequestId to response mapping
	mapping(bytes32 => bool) private results;

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
	function fetchProofOfWork(uint96 _id)
		public
		returns (bytes32 requestId, uint96 iteration)
	{
		require(_id < id, "invalid id");
		Stream memory stream = streams[_id];
		if (stream.iteration == stream.numberOfCheckpoints) {
			// stop stream
			break;
		}
		Chainlink.Request memory request = buildChainlinkRequest(
			jobId,
			address(this),
			this.fulfill.selector
		);
		// Set the URL to perform the GET request on
		// NOTE: If this oracle gets more than 5 requests from this job at a time, it will not return.
		// replace the sender's server url here

		/* solhint-disable not-rely-on-time */
		string
			memory url = "https://secure-fortress-91179.herokuapp.com/validate?token=" +
				stream.accessToken +
				"&from=" +
				(stream.startTime + (stream.iteration * stream.checkpoint)) +
				"&to=" +
				stream.startTime +
				((stream.iteration + 1) * stream.checkpoint);
		/* solhint-enable not-rely-on-time */
		request.add("get", url);
		bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);
		requests[stream.id][iteration] = requestId;
		streams[_id].iteration++;
		return (requestId, streams[_id].iteration - 1);
	}

	/**
	 * Creates a new stream
	 */
	function createStream(
		address _receiver,
		int96 _flowRate,
		uint96 _numberOfCheckpoints,
		uint96 _numberOfCheckpoints,
		string memory _proofOfWorkEndpoint,
		string memory _accessToken
	) public {
		require(address(_receiver) != address(0), "invalid receiver address");
		// Create a superfluid stream from sender to contract and on 1st checkpoint contract to receiver;
		// solhint-disable-next-line not-rely-on-time
		uint96 startTime = block.timestamp;
		Stream memory stream = Stream(
			id,
			msg.sender,
			_receiver,
			_flowRate,
			startTime,
			_numberOfCheckpoints,
			_numberOfCheckpoints,
			0,
			_proofOfWorkEndpoint,
			_accessToken,
			SUPERDAI,
			true
		);
		streams[id] = stream;
		id++;
	}

	/**
	 * Receive the response in the form of bool
	 */
	function fulfill(bytes32 _requestId, bool _result)
		public
		recordChainlinkFulfillment(_requestId)
	{
		results[_requestId] = _result;
	}
}
