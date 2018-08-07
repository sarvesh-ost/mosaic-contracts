pragma solidity ^0.4.23;

import "./ProtocolVersioned.sol";
import "./Owned.sol";
import "./OpenSTProtocol.sol";
import "./WorkersInterface.sol";
import "./UtilityTokenInterface.sol";
import "./CoreInterface.sol";
import "./ProofLib.sol";
import "./EIP20Interface.sol";

contract CoGateway is ProtocolVersioned, Owned {

    event RedeemRequested(address _redeemer, uint256 _amount, address _beneficiary, uint256 _nonce, bytes32 _requestHash);
    event StakingIntentConfirmed(bytes32 _uuid, bytes32 _intentConfirmedHash_, address _staker, address _beneficiary, uint256 _amount, uint256 _expirationHeight,
        uint256 _blockHeight, bytes32 _storageRoot);

    event RedeemRequestAccepted(
        address _redeemer,
        uint256 _amount,
        uint256 _nonce,
        uint256 _unlockHeight,
        bytes32 _redeemIntentHash);

    mapping(bytes32 /*requestHash */ => RedeemRequest) public redeemRequests;

    mapping(address /*account */ => uint256) public nonces;

    EIP20Interface public utilityToken;
    uint256 public bounty;

    WorkersInterface public workers;

    OpenSTProtocol.ProtocolStorage protocolStorage;
    CoreInterface private core;
    uint8 private constant intentsMappingStorageIndexPosition = 4;
    bytes32 uuid;

    struct RedeemRequest {
        uint256 amount;
        address beneficiary;
    }



    function requestRedeem(
        uint256 _amount,
        address _beneficiary)
        external
        returns (
            uint256 nonce_,
            bytes32 requestHash_)
    {
        require(_amount > uint256(0));
        require(_beneficiary != address(0));

        nonces[msg.sender]++;
        nonce_ = nonces[msg.sender];
        bytes32 data = keccak256(abi.encodePacked(_amount, _beneficiary));

        requestHash_ = OpenSTProtocol.request(protocolStorage, nonce_, data);
        // check if the redeem request does not exists
        require(redeemRequests[requestHash_].beneficiary == address(0));

        require(utilityToken.transferFrom(msg.sender, address(this), _amount));

        redeemRequests[requestHash_] = RedeemRequest({
            amount: _amount,
            beneficiary: _beneficiary});

        emit RedeemRequested(msg.sender, _amount, _beneficiary, nonce_, requestHash_);

    }

    function revertRedeemRequest(bytes32 _requestHash)
        external
        returns (
            uint256 amount_,
            address beneficiary_)
    {
        require(OpenSTProtocol.revertRequest(protocolStorage, _requestHash));
        delete redeemRequests[_requestHash];
    }


    function acceptRedeemRequest(
        bytes32 _requestHash,
        bytes32 _hashLock
    )
    external
    returns (
        uint256 unlockHeight_,
        bytes32 redeemIntentHash_
    )
    {
        // check if the caller is whitelisted worker
        require(workers.isWorker(msg.sender));
        require(_hashLock != bytes32(0));
        require(_requestHash != bytes32(0));

        RedeemRequest storage redeemRequest = redeemRequests[_requestHash];

        // check if the stake request exists
        require(redeemRequest.beneficiary != address(0));

        // Transfer bounty amount from worker to Gateway contract
        require(utilityToken.transferFrom(msg.sender, address(this), bounty));

        (redeemIntentHash_, unlockHeight_) = OpenSTProtocol.declareIntent(protocolStorage, _requestHash, _hashLock);

        OpenSTProtocol.Request storage request = protocolStorage.requests[_requestHash];

        emit RedeemRequestAccepted(request.requester, redeemRequest.amount, request.nonce, unlockHeight_, redeemIntentHash_);
    }



    function confirmStakingIntent(
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _unlockHeight,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes _rlpParentNodes)
        external
        returns (
            bytes32 intentConfirmedHash_,
            uint256 expirationHeight_)
    {
        bytes32 data = keccak256(abi.encodePacked(_amount, _beneficiary));
        bytes32 requestHash = keccak256(abi.encodePacked(_staker, _stakerNonce, data));
        bytes32 stakingIntentHash = keccak256(abi.encodePacked(requestHash, _unlockHeight, _hashLock));

        bytes memory path = ProofLib.bytes32ToBytes(
            ProofLib.storageVariablePath(intentsMappingStorageIndexPosition,
            keccak256(abi.encodePacked(_staker, _stakerNonce)))
        );

        bytes32 storageRoot = core.getStorageRoot(_blockHeight);

        require(storageRoot != bytes32(0));

        (intentConfirmedHash_, expirationHeight_ ) = OpenSTProtocol.confirmIntent(protocolStorage, stakingIntentHash, _hashLock, storageRoot, _blockHeight, path, _rlpParentNodes);

        emit StakingIntentConfirmed(uuid, intentConfirmedHash_, _staker, _beneficiary, _amount, expirationHeight_, _blockHeight, storageRoot);

    }
}
