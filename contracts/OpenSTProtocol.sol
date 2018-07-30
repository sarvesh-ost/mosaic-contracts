pragma solidity ^0.4.23;

import "./CoGateway.sol";
import "./EIP20Interface.sol";


library OpenSTProtocol {


    struct ProtocolStorage {
        mapping(address /*staker */ => OpenSTProtocol.ConversionRequest) conversionRequests;
    }


    struct ConversionRequest {
        uint256 amount;
        uint256 unlockHeight;
        address beneficiary;
        bytes32 hashLock;
    }

    /* accept stake or accept redeem*/
    function requestConversion(
        ProtocolStorage storage protocolStorage,
        address brandedToken,
        uint256 _amount,
        address _beneficiary)
    internal
    returns (bool /* success*/){

        require(EIP20Interface(brandedToken).transferFrom(msg.sender, address(this), _amount));

        protocolStorage.conversionRequests[msg.sender] = ConversionRequest({
            amount : _amount,
            beneficiary : _beneficiary,
            hashLock : 0,
            unlockHeight : 0
            });
        return true;
    }

    function processConversion(){

    }

    function rejectConversion(){

    }

    function revertConversion(){

    }

    function confirmConversionIntent(){

    }

    function mint(){

    }

    function unstake(){

    }


}
