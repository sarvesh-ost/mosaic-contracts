pragma solidity ^0.4.23;

import "./ProtocolVersioned.sol";
import "./Owned.sol";
import "./WorkersInterface.sol";
import "./ValueToken.sol"; // this will be interface
import "./BrandedTokenStake.sol";
import "./OpenSTProtocol.sol";

contract Gateway is ProtocolVersioned, Owned {

    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);



    WorkersInterface public workers;
    uint256 public bounty;
    ValueToken public valueToken;
    bytes public coGatewayCodeHash;
    BrandedTokenStake public brandedTokenStake;


    address core;
    /** Structures */

    struct CoGateway {
        address coGateway;
        bytes codeHash;
        uint256 chainId;
    }


    OpenSTProtocol.ProtocolStorage public protocolStorage;

    function requestStake(
        uint256 _amount,
        address _beneficiary)
    external
    returns (bool /* success */)
    {
        require(_amount > uint256(0));
        require(_beneficiary != address(0));

        // check if the stake request does not exists
        require(protocolStorage.conversionRequests[msg.sender].beneficiary == address(0));

        require(OpenSTProtocol.requestConversion(protocolStorage, valueToken, _amount, _beneficiary));

        emit StakeRequested(msg.sender, _amount, _beneficiary);

        return true;
    }



}