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
        bytes32 _stakingIntentHash,
        bytes32 _stakingIntentKeyHash);

    event StakingIntentDeclared(bytes32 indexed _uuid, address indexed _staker,
        uint256 _stakerNonce, bytes32 _intentKeyHash, address _beneficiary, uint256 _amount,
        uint256 _unlockHeight, bytes32 _stakingIntentHash);


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

    function acceptStakeRequest(address _staker, bytes32 _hashLock)
        external
        returns (
            uint256 _amount,
            uint256 _nonce,
            uint256 _unlockHeight,
            bytes32 _stakingIntentHash,
            bytes32 _stakingIntentKeyHash)
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


        (_amount, _nonce, _unlockHeight, _stakingIntentHash, _stakingIntentKeyHash) = OpenSTProtocol.acceptConversion(
            protocolStorage,
            uuid,
            valueToken,
            bounty,
            _staker);

        assert(_stakingIntentHash != bytes32(0));

        emit StakeRequestAccepted(_staker, _amount, _nonce, _unlockHeight, _stakingIntentHash, _stakingIntentKeyHash);

        emit StakingIntentDeclared(uuid, _staker, _nonce, _stakingIntentKeyHash, stakeRequest.beneficiary,
            _amount, _unlockHeight, _stakingIntentHash);
        return (_amount, _nonce, _unlockHeight, _stakingIntentHash, _stakingIntentKeyHash);
    }


    function stake(
        uint256 _amount,
        address _beneficiary,
        bytes32 _hashLock)
    external
    returns (
        uint256 ,
        uint256 _nonce,
        uint256 _unlockHeight,
        bytes32 _stakingIntentHash,
        bytes32 _stakingIntentKeyHash)
    {
        require(_amount > uint256(0));
        require(_beneficiary != address(0));

        (, _nonce, _unlockHeight, _stakingIntentHash, _stakingIntentKeyHash) = OpenSTProtocol.conversionIntent(
            protocolStorage,
            valueToken,
            uuid,
            _amount,
            _beneficiary,
            _hashLock,
            msg.sender);

        emit StakingIntentDeclared(uuid, msg.sender, _nonce, _stakingIntentKeyHash, _beneficiary,
            _amount, _unlockHeight, _stakingIntentHash);

        return (_amount, _nonce, _unlockHeight, _stakingIntentHash, _stakingIntentKeyHash);
    }

}