//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";

contract Cuperfluid is ChainlinkClient, SuperAppBase, BaseRelayRecipient {
	using Chainlink for Chainlink.Request;

	uint96 public id;

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

	// superfluid
	ISuperfluid private host; // host
	IConstantFlowAgreementV1 private cfa; // the stored constant flow agreement class address
	// solhint-disable-next-line state-visibility
	address constant SUPERDAI =
		address(0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f); // on Polygon Mumbai Testnet

	// events
	event StreamCreated(uint96 id, Stream stream);
	event ProofOfWorkRequested(bytes32 requestId, uint96 _id, uint96 iteration);
	event StreamActivated(uint96 id);
	event StreamDeactivated(uint96 id);
	event DeleteStream(uint96 id);

	/**
	 * Chainlink Configurations
	 * Network: Polygon Mumbai Testnet
	 * Oracle: 0x58bbdbfb6fca3129b91f0dbe372098123b38b5e9
	 * Job ID: 999539ec63414233bdc989d8a8ff10aa (bool)
	 * LINK address: 0x326C977E6efc84E512bB9C30f76E30c160eD06FB
	 * Fee: 0.01 LINK
	 */
	constructor(ISuperfluid _host, IConstantFlowAgreementV1 _cfa) {
		assert(address(_host) != address(0));
		assert(address(_cfa) != address(0));

		id = 0;
		host = _host;
		cfa = _cfa;

		// fix for now: Polygon Mumbai Testnet forwarder address
		// take as param and create a only owner setter method in future
		trustedForwarder = address(0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b);

		uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
			SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
			SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
			SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

		_host.registerApp(configWord);

		// chainlink
		setChainlinkToken(
			(address(0x326C977E6efc84E512bB9C30f76E30c160eD06FB))
		);
		oracle = address(0x58BBDbfb6fca3129b91f0DBE372098123B38B5e9);
		jobId = "999539ec63414233bdc989d8a8ff10aa";
		fee = 10**16; // 0.01 LINK
	}

	/**
	 * Fetch Proof Of Work
	 * @dev This function is called on each checkpoint interval
	 */
	function fetchProofOfWork(uint96 _id) public {
		require(_id < id, "invalid id");
		Stream memory stream = streams[_id];
		require(
			stream.iteration <= stream.numberOfCheckpoints,
			"iteration limit exceeded"
		);

		// check if we have iterated over all checkpoints or not
		// if yes, perform actions for stopping the stream
		if (stream.iteration == stream.numberOfCheckpoints) {
			// stop stream (both in flow and out flow)
			// TODO: perform remaining token distributions (if any)
			emit DeleteStream(_id);
		}

		// create a url here
		/* solhint-disable not-rely-on-time */
		string memory url = string(
			abi.encodePacked(
				stream.proofOfWorkEndpoint,
				"?token=",
				stream.accessToken,
				"&from=",
				(stream.startTime +
					(stream.iteration * stream.checkpointInterval)),
				"&to=",
				stream.startTime +
					((stream.iteration + 1) * stream.checkpointInterval)
			)
		);
		// string memory url = "https://secure-fortress-91179.herokuapp.com/validate?token=5c03fe67f60a8dcbc5df674f0a8df8f2&from=1&to=1";
		/* solhint-enable not-rely-on-time */

		// create new chainlink request
		Chainlink.Request memory request = buildChainlinkRequest(
			"999539ec63414233bdc989d8a8ff10aa",
			address(this),
			this.fulfill.selector
		);
		// fixed the url due to some end moment gas error
		// ideally, use the above created url
		request.add("get", url);
		bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);

		// add the request to mapping and increment the iteration for checkpoint
		requests[stream.id][stream.iteration] = requestId;
		streams[_id].iteration++;
		emit ProofOfWorkRequested(requestId, _id, streams[_id].iteration - 1);
	}

	/**
	 * Fetch the Proof Of Work Result
	 */
	function fetchProofOfWorkResult(bytes32 _requestId)
		public
		view
		returns (bool)
	{
		return results[_requestId];
	}

	/**
	 * Creates a new stream object
	 */
	function createStream(
		address _receiver,
		int96 _flowRate,
		uint96 _numberOfCheckpoints,
		uint96 _checkpointInterval,
		string memory _proofOfWorkEndpoint,
		string memory _accessToken
	) public {
		// validations
		/* solhint-disable reason-string */
		require(address(_receiver) != address(0), "invalid receiver address");
		require(_flowRate > 0, "flow rate cannot be non positive");
		require(
			_numberOfCheckpoints > 0,
			"number of checkpoints cannot be non positive"
		);
		require(
			_checkpointInterval > 0,
			"checkpoint interval cannot be non positive"
		);
		/* solhint-enable reason-string */

		// solhint-disable-next-line not-rely-on-time
		uint96 startTime = uint96(block.timestamp);
		Stream memory stream = Stream(
			id,
			_msgSender(),
			_receiver,
			_flowRate,
			startTime,
			_numberOfCheckpoints,
			_checkpointInterval,
			0,
			_proofOfWorkEndpoint,
			_accessToken,
			SUPERDAI,
			false
		);
		streams[id] = stream;
		id++;
		emit StreamCreated(id - 1, stream);
	}

	/**
	 * Create a new supefluid constant flow
	 */
	function createSuperfluidStream(
		uint96 _id,
		address _receiver,
		int96 _flowRate,
		address _token
	) public {
		host.callAgreement(
			cfa,
			abi.encodeWithSelector(
				cfa.createFlow.selector,
				_token,
				_receiver,
				_flowRate,
				new bytes(0)
			),
			"0x"
		);
		streams[_id].isActive = true;
		emit StreamActivated(_id);
	}

	/**
	 * Delete an existing superfluid constant flow
	 */
	function deleteSuperfluidStream(
		uint96 _id,
		address _receiver,
		address _token
	) public {
		host.callAgreement(
			cfa,
			abi.encodeWithSelector(
				cfa.deleteFlow.selector,
				_token,
				address(this),
				_receiver,
				new bytes(0)
			),
			"0x"
		);
		streams[_id].isActive = false;
		emit StreamDeactivated(_id);
	}

	/**
	 * Get the latest ID
	 */
	function getId() public view returns (uint96) {
		return id;
	}

	/**
	 * Get Stream by ID
	 */
	function getStreamById(uint96 _id) public view returns (Stream memory) {
		require(_id < id, "invalid id");
		return streams[_id];
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

	/**
	 * SuperApp callbacks
	 * @dev superfluid callback representing creation of new agreement
	 */
	function afterAgreementCreated(
		ISuperToken _superToken,
		address _agreementClass,
		bytes32, // _agreementId,
		bytes calldata, /*_agreementData*/
		bytes calldata, // _cbdata,
		bytes calldata _ctx
	)
		external
		override
		onlyExpected(_superToken, _agreementClass)
		onlyHost
		returns (bytes memory newCtx)
	{}

	// not providing capability for updation and termination of agreement as of now

	function _isCFAv1(address agreementClass) private view returns (bool) {
		return
			ISuperAgreement(agreementClass).agreementType() ==
			keccak256(
				"org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
			);
	}

	modifier onlyHost() {
		require(msg.sender == address(host), "support only one host");
		_;
	}

	modifier onlyExpected(ISuperToken superToken, address agreementClass) {
		// require(_isSameToken(superToken), "not accepted token");
		require(_isCFAv1(agreementClass), "only CFAv1 supported");
		_;
	}

	/**
	 * Override this function.
	 * This version is to keep track of BaseRelayRecipient you are using
	 * in your contract.
	 */
	function versionRecipient() external pure override returns (string memory) {
		return "1";
	}
}
