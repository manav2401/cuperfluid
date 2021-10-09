//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";

contract Cuperfluid is SuperAppBase {
	ISuperfluid private _host; // host
	IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
	ISuperToken private _acceptedToken; // accepted token
	address private _receiver;

	constructor(
		ISuperfluid host,
		IConstantFlowAgreementV1 cfa,
		ISuperToken acceptedToken,
		address receiver
	) {
		assert(address(host) != address(0));
		assert(address(cfa) != address(0));
		assert(address(acceptedToken) != address(0));
		assert(address(receiver) != address(0));
		//assert(!_host.isApp(ISuperApp(receiver)));

		_host = host;
		_cfa = cfa;
		_acceptedToken = acceptedToken;
		_receiver = receiver;

		uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
			SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
			SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
			SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

		_host.registerApp(configWord);
	}

    /**
     * SuperApp callbacks
     */
    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata /*_agreementData*/,
        bytes calldata ,// _cbdata,
        bytes calldata _ctx
    )
        external override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        //
    }

    // ignore this
    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 ,//_agreementId,
        bytes calldata /*_agreementData*/,
        bytes calldata ,//_cbdata,
        bytes calldata _ctx
    )
        external override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        //
    }

    // ignore this
    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 ,//_agreementId,
        bytes calldata /*_agreementData*/,
        bytes calldata ,//_cbdata,
        bytes calldata _ctx
    )
        external override
        onlyHost
        returns (bytes memory newCtx)
    {
        //
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(_acceptedToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType()
            == keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");
    }

    modifier onlyHost() {
        require(msg.sender == address(_host), "RedirectAll: support only one host");
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isSameToken(superToken), "RedirectAll: not accepted token");
        require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
        _;
    }
}
