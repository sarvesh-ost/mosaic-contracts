pragma solidity ^0.4.23;

import "./ProtocolVersioned.sol";
import "./Owned.sol";
import "./OpenSTProtocol.sol";
import "./WorkersInterface.sol";

contract CoGateway is ProtocolVersioned, Owned {

    event RedeemRequested(address _staker, uint256 _amount, address _beneficiary);
    event RedeemRequestAccepted(
        address _redeemer,
        uint256 _amount,
        uint256 _nonce,
        uint256 _unlockHeight,
        bytes32 _redeemIntentHash);

    event RedeemIntentDeclared(
        bytes32 _uuid,
        address _redeemer,
        uint256 _nonce,
        bytes32 _intentKeyHash,
        address _beneficiary,
        uint256 _amount,
        uint256 _unlockHeight,
        bytes32 redeemIntentHash);

    event ProcessedRedemption(
        bytes32 _uuid,
        bytes32 _redemptionIntentHash,
        address _brandedToken,
        address _redeemer,
        address _beneficiary,
        uint256 amount,
        bytes32 _unlockSecret);

    constructor(){

    }

    bytes32 uuid;
    WorkersInterface public workers;
    uint256 public bounty;
    address public brandedToken;
    address public openSTProtocol;
    OpenSTProtocol.ProtocolStorage protocolStorage;
    address redeemer;

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

    function acceptRedeemRequest(address _redeemer, bytes32 _hashLock)
    external
    returns (
        uint256 amount,
        uint256 nonce,
        uint256 unlockHeight,
        bytes32 redeemIntentHash,
        bytes32 intentKeyHash)
    {
        // check if the caller is whitelisted worker
        require(workers.isWorker(msg.sender));

        OpenSTProtocol.ConversionRequest storage redeemRequest = protocolStorage.conversionRequests[_redeemer];

        // check if the stake request exists
        require(redeemRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(redeemRequest.hashLock == bytes32(0));

        // check if _hashLock is not 0
        require(_hashLock != bytes32(0));

        (amount, nonce, unlockHeight, redeemIntentHash, intentKeyHash) = OpenSTProtocol.acceptConversion(protocolStorage, uuid, brandedToken, bounty, _redeemer);

        emit RedeemRequestAccepted(_redeemer, amount, nonce, unlockHeight, redeemIntentHash);

        return (amount, nonce, unlockHeight, redeemIntentHash, intentKeyHash);
    }

    function redeem(
        uint256 _amount,
        address _beneficiary,
        bytes32 _hashLock)
    returns (
        uint256 amount,
        uint256 nonce,
        uint256 unlockHeight,
        bytes32 redeemIntentHash,
        bytes32 intentKeyHash)
    {
        require(_amount > 0);
        require(_beneficiary != address(0));

        (amount, nonce, unlockHeight, redeemIntentHash, intentKeyHash) = OpenSTProtocol.conversionIntent(protocolStorage, brandedToken, uuid, _amount, _beneficiary, _hashLock, msg.sender);

        emit RedeemIntentDeclared(uuid, msg.sender, nonce, intentKeyHash, _beneficiary, amount, unlockHeight, redeemIntentHash);

        return (amount, nonce, unlockHeight, redeemIntentHash, intentKeyHash);
    }


    function processRedeem(
        bytes32 _redemptionIntentHash,
        bytes32 _unlockSecret)
    returns (
        address redeemer,
        uint256 amount
    )
    {

        require(_redemptionIntentHash != "");

        OpenSTProtocol.Conversion storage redeem = protocolStorage.conversions[_redemptionIntentHash];
        address beneficiary = redeem.beneficiary;

        require(redeem.converter != address(0));
        require(redeem.hashLock != bytes32(0));
        require(redeem.beneficiary != address(0));


        (redeemer, amount) = OpenSTProtocol.processConversion(protocolStorage, brandedToken, _redemptionIntentHash, _unlockSecret);

        emit ProcessedRedemption(uuid, _redemptionIntentHash, brandedToken,
            redeemer, beneficiary, amount, _unlockSecret);

        return (redeemer, amount);
    }

    function confirmStakingIntent(
        bytes32 _uuid,
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _stakingUnlockHeight,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes _rlpParentNodes)
    external
    returns (uint256 expirationHeight)
    {
        require(_uuid == uuid );

        require(protocolStorage.nonces[_staker] < _stakerNonce);
        require(_amount > 0);

        // stakingUnlockheight needs to be checked against the core that tracks the value chain
        require(_stakingUnlockHeight > 0);

        require(protocolStorage.core.safeUnlockHeight() < _stakingUnlockHeight);

        expirationHeight = block.number + blocksToWaitShort;
        nonces[_staker] = _stakerNonce;

        bytes32 stakingIntentHash = hashStakingIntent(
            _uuid,
            _staker,
            _stakerNonce,
            _beneficiary,
            _amountST,
            _amountUT,
            _stakingUnlockHeight,
            _hashLock
        );
        require(merkleVerificationOfStake(
                _staker,
                _stakerNonce,
                stakingIntentHash,
                _rlpParentNodes,
                core.getStorageRoot(_blockHeight)));

        mints[stakingIntentHash] = Mint({
            uuid:             _uuid,
            staker:           _staker,
            beneficiary:      _beneficiary,
            amount:           _amountUT,
            expirationHeight: expirationHeight,
            hashLock:         _hashLock
            });

        emit StakingIntentConfirmed(_uuid, stakingIntentHash, _staker, _beneficiary, _amountST,
            _amountUT, expirationHeight, _blockHeight ,core.getStorageRoot(_blockHeight));

        return expirationHeight;
    }



}
