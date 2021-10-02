//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;

import "@chainlink/contracts/src/v0.7/ChainlinkClient.sol";

contract Handler is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    uint256 public id;

    // chainlink params
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    /**
     * Network: Polygon Mumbai Testnet
     * Oracle: 0x58bbdbfb6fca3129b91f0dbe372098123b38b5e9
     * Job ID: da20aae0e4c843f6949e5cb3f7cfe8c4 (uint256)
     * LINK address: 0x326C977E6efc84E512bB9C30f76E30c160eD06FB
     * Fee: 0.01 LINK
     */
    constructor() public {
        setChainlinkToken(
            (address(0x326C977E6efc84E512bB9C30f76E30c160eD06FB))
        );
        oracle = address(0x58BBDbfb6fca3129b91f0DBE372098123B38B5e9);
        jobId = "da20aae0e4c843f6949e5cb3f7cfe8c4";
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
        request.add("get", "https://jsonplaceholder.typicode.com/todos/1"); // dummy api
        string[] memory path = new string[](1);
        path[0] = "userId";
        request.addStringArray("path", path);
        return sendChainlinkRequestTo(oracle, request, fee);
    }

    /**
     * Receive the response in the form of uint256
     */
    function fulfill(bytes32 _requestId, uint256 _id)
        public
        recordChainlinkFulfillment(_requestId)
    {
        id = _id;
    }

    function getId() public returns (uint256) {
        return id;
    }
}
