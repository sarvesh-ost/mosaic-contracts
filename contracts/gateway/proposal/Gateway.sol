/*
pragma solidity ^0.4.23;

import "./ProtocolVersioned.sol";
import "./Owned.sol";
import "./WorkersInterface.sol";
import "./ValueToken.sol"; // this will be interface
import "./BrandedTokenStake.sol";
import "./OpenSTProtocol.sol";
import "./EIP20Interface.sol";

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

    event ProcessedStake(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash,
        address _stake, address _staker, uint256 _amount, bytes32 _unlockSecret);


    bytes32 public uuid;
    WorkersInterface public workers;
    EIP20Interface public valueToken;
    uint256 public bounty;
    OpenSTProtocol.ProtocolStorage protocolStorage;


    bytes public coGatewayCodeHash;
    BrandedTokenStake public brandedTokenStake;
    address stakingAccount;


    address core;
    */
/** Structures *//*


    struct CoGateway {
        address coGateway;
        bytes codeHash;
        uint256 chainId;
    }




    function requestStake(
        uint256 _amount,
        address _beneficiary)
    external
    returns (bool */
/* success *//*
)
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
tru
        return (_amount, _nonce, _unlockHeight, _stakingIntentHash, _stakingIntentKeyHash);
    }


    function processStaking(
        bytes32 _stakingIntentHash,
        bytes32 _unlockSecret)
    external
    returns (address stakerAddress, uint256 stakeRequestAmount)
    {
        require(_stakingIntentHash != bytes32(0));

        OpenSTProtocol.Conversion storage conversion =  protocolStorage.conversions[_stakingIntentHash];
        require(conversion.converter != address(0));

        OpenSTProtocol.ConversionRequest storage conversionRequest = protocolStorage.conversionRequests[conversion.converter];

        // check if the stake request exists
        require(conversionRequest.beneficiary != address(0));

        // check if the stake request was accepted
        require(conversionRequest.hashLock != bytes32(0));

        (stakerAddress, stakeRequestAmount) = OpenSTProtocol.processConversion(protocolStorage, valueToken, _stakingIntentHash, _unlockSecret);

        // check if the stake address is not 0
        assert(stakerAddress != address(0));

        //If the msg.sender is whitelited worker then transfer the bounty amount to Workers contract
        //else transfer the bounty to msg.sender.
        if (workers.isWorker(msg.sender)) {
            // Transfer bounty amount to the workers contract address
            require(valueToken.transfer(workers, bounty));
        } else {
            //Transfer bounty amount to the msg.sender account
            require(valueToken.transfer(msg.sender, bounty));
        }

        emit ProcessedStake(uuid, _stakingIntentHash, protocolStorage.stakeAddress, stakerAddress, stakeRequestAmount, _unlockSecret);


    return (stakerAddress, stakeRequestAmount);
    }

}
*/
