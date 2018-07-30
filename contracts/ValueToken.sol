pragma solidity ^0.4.23;

import "./SafeMath.sol";
import "./EIP20Token.sol";
import "./Owned.sol";
import "./FunctionalActor.sol";
import "./WorkersInterface.sol";

contract ValueToken is EIP20Token, Owned {

    mapping(address /* account */ => uint256 /* amount */) private requestedConversions;

    FunctionalActor functionalActors;
    WorkersInterface private workers;
    //ValueToken private valueToken;

    uint256 private conversionRate;
    uint8 private conversionRateDecimals;

    modifier onlyFunctionalActor() {
        require(functionalActors.isFunctionalActor(msg.sender));
        _;
    }


    constructor(string _symbol,
        string _name,
        uint8 _decimals,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        FunctionalActor _functionalActors,
        WorkersInterface _workers)
    public
    EIP20Token(_symbol, _name, _decimals)
    {
        functionalActors = _functionalActors;
    }
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


    function transfer(
        address _to,
        uint256 _value)
        public
        onlyFunctionalActor
        returns (bool success) {
        return super.transfer(_to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value)
        public
        returns (bool success)
    {
        require(functionalActors.isFunctionalActor(_to));
        return super.transferFrom(_from, _to, _value);
    }

    function mint(uint256 _amount)
        internal
        onlyFunctionalActor
        returns (bool /* success */) {
        return mintEIP20(_amount);
    }

    function burn(uint256 _amount)
        internal
        onlyFunctionalActor
        returns (bool /* success */)
    {
        return burnEIP20(_amount);
    }
}
