pragma solidity ^0.4.23;

import "./WorkersInterface.sol";
import "./ValueToken.sol";


contract TokenConversion {

    mapping(address /* account */ => uint256 /* amount */) private requestedConversions;

    WorkersInterface private workers;
    ValueToken private valueToken;

    uint256 private conversionRate;
    uint8 private conversionRateDecimals;

    constructor(uint256 _conversionRate, uint8 _conversionRateDecimals, ValueToken _valueToken, WorkersInterface _workers) public{}
        // User needs to approve Token Contract before calling request conversion.
    // The amount will be not be transferred to Token contract in this step.
    // The amount will be stored in to a requestedConversions mapping.
    function requestConversion(uint256 _amount) external returns (uint256 _btAmount);
//Question: Can user requestedConversions multiple times?

    // User can cancel the requestedConversions by calling cancelRequestedConversions.
    // If the requestedConversions mapping includes the amount for the msg.sender address,
    // then the entry will be deleted from the requestedConversions mapping.
    function cancelRequestedConversions() external returns (uint256 _btAmount);

    function rejectRequestedConversions(address _requester, uint8 _reason) external onlyWorker returns (_requester, uint256 _amount,_reason);

    function acceptRequestedConversions(address _requester) external returns (_requester, uint256 amount, uint256 _btAmount);

    // After unstake user(msg.sender) can claim the tokens.
    // ERC20Token (e.g SimpleToken) will be transfered to beneficiary address
    // The amount of tokens to be transferred is calculated using conversion rates.
    function claimToken(address beneficiary) external returns (uint256 _amount);
//Question: Should allow partial claim ?





}