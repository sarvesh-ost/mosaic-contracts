pragma solidity ^0.4.23;

import "./ProtocolVersioned.sol";
import "./Owned.sol";
import "./OpenSTProtocol.sol";

contract CoGateway is ProtocolVersioned, Owned {

    event RedeemRequested(address _staker, uint256 _amount, address _beneficiary);

    constructor(){

    }

    OpenSTProtocol.ProtocolStorage protocolStorage;

    address brandedToken;
    address openSTProtocol;

    function requestRedeem(
        uint256 _amount,
        address _beneficiary)
    external
    returns (bool /* success */)
    {

        require(_amount > uint256(0));
        require(_beneficiary != address(0));
        // check if the stake request does not exists
        require(protocolStorage.conversionRequests[msg.sender].beneficiary == address(0));

        require(OpenSTProtocol.requestConversion(protocolStorage, brandedToken, _amount, _beneficiary));
        emit RedeemRequested(msg.sender, _amount, _beneficiary);

        return true;
    }




}
