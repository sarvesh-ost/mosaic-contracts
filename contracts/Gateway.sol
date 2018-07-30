pragma solidity ^0.4.23;

import "./ProtocolVersioned.sol";
import "./Owned.sol";
import "./WorkersInterface.sol";
import "./ValueToken.sol"; // this will be interface
import "./BrandedTokenStake.sol";
import "./OpenSTProtocol.sol";

contract Gateway is ProtocolVersioned, Owned {

    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);
    event StakeRequestAccepted(
        address _staker,
        uint256 _amount,
        uint256 _nonce,
        uint256 _unlockHeight,
        bytes32 _stakingIntentHash);

    bytes32 public uuid;
    WorkersInterface public workers;
    address public valueToken;
    uint256 public bounty;
    OpenSTProtocol.ProtocolStorage protocolStorage;


    bytes public coGatewayCodeHash;
    BrandedTokenStake public brandedTokenStake;
    address stakingAccount;


    address core;
    /** Structures */

    struct CoGateway {
        address coGateway;
        bytes codeHash;
        uint256 chainId;
    }




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

/*
    function acceptStakeRequest(address _staker, bytes32 _hashLock)
        external
        returns (
            uint256 amountUT,
            uint256 nonce,
            uint256 unlockHeight,
            bytes32 stakingIntentHash)
    {
        // check if the caller is whitelisted worker
        require(workers.isWorker(msg.sender));

        OpenSTProtocol.ConversionRequest storage stakeRequest = protocolStorage.conversionRequests[_staker];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        // check if _hashLock is not 0
        require(_hashLock != bytes32(0));

        // Transfer bounty amount from worker to Gateway contract
        require(valueToken.transferFrom(msg.sender, address(this), bounty));

        (amountUT, nonce, unlockHeight, stakingIntentHash) = OpenSTProtocol.stake(
            protocolStorage,
            uuid,
            stakeRequest.amount,
            stakeRequest.beneficiary,
            _hashLock,
            _staker);

        // Check if the stake function call did not result in to error.
        require(stakingIntentHash != bytes32(0));

        stakeRequests[_staker].unlockHeight = unlockHeight;
        stakeRequests[_staker].hashLock = _hashLock;

        emit StakeRequestAccepted(_staker, stakeRequest.amount, amountUT, nonce, unlockHeight, stakingIntentHash);

        return (amountUT, nonce, unlockHeight, stakingIntentHash);
    }

*/
}