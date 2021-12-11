//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract Meta is BaseRelayRecipient {

  mapping(address => uint256) public map;

  function getNumber() public view returns (uint256) {
    return map[msg.sender];
  }

  function setNumber(uint256 _number) public {
    map[_msgSender()] = _number;
  }

	constructor() {
		// Polygon Mumbai Testnet forwarder address
		trustedForwarder = address(0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b);
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
