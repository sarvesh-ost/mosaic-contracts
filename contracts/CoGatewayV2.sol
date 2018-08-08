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

    event RedeemRequested(
        address _redeemer,
        uint256 _amount,
        address _beneficiary,
        uint256 _nonce,
        bytes32 _requestHash);

    event RedeemRequestReverted(
        address _redeemer,
        address _beneficiary,
        uint256 _amount);

    event ProcessedRedemption(
        bytes32 indexed _uuid,
        bytes32 indexed _redemptionIntentHash,
        address _redeemer,
        address _beneficiary,
        uint256 _amount,
        bytes32 _unlockSecret);

    event StakingIntentConfirmed(
        bytes32 _uuid,
        bytes32 _intentConfirmedHash_,
        address _staker,
        address _beneficiary,
        uint256 _amount,
        uint256 _expirationHeight,
        uint256 _blockHeight,
        bytes32 _storageRoot);

    event RedeemRequestAccepted(
        address _redeemer,
        uint256 _amount,
        uint256 _nonce,
        uint256 _unlockHeight,
        bytes32 _redeemIntentHash);

    event RevertedRedemption(
        bytes32 indexed _uuid,
        bytes32 indexed _redemptionIntentHash,
        address _redeemer,
        address _beneficiary,
        uint256 _amount);

    mapping(bytes32 /*requestHash */ => Request) public redeemRequests;
    mapping(bytes32 /*intentHash */ => Request) public mintRequests;

    mapping(address /*account */ => uint256) public nonces;

    EIP20Interface public utilityToken;
    uint256 public bounty;

    WorkersInterface public workers;

    address escrow;

    OpenSTProtocol.ProtocolStorage protocolStorage;
    CoreInterface private core;
    uint8 private constant intentsMappingStorageIndexPosition = 4;
    bytes32 uuid;

    struct Request {
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

        redeemRequests[requestHash_] = Request({
            amount: _amount,
            beneficiary: _beneficiary});

        emit RedeemRequested(msg.sender, _amount, _beneficiary, nonce_, requestHash_);

    }

    function revertRedeemRequest(bytes32 _requestHash)
        external
        returns (
            address redeemer_,
            address beneficiary_,
            uint256 amount_)
    {
        require(_requestHash != bytes32(0));

        redeemer_ = OpenSTProtocol.revertRequest(protocolStorage, _requestHash);

        Request storage redeemRequest = redeemRequests[_requestHash];

        // check if the stake request exists
        require(redeemRequest.beneficiary != address(0));
        amount_ = redeemRequest.amount;
        beneficiary_ = redeemRequest.beneficiary;

        require(utilityToken.transfer(redeemer_, amount_));

        // delete the redeem request from the mapping storage
        delete redeemRequests[_requestHash];

        emit RedeemRequestReverted(redeemer_, beneficiary_, amount_);

    }

    function acceptRedeemRequest(
        bytes32 _requestHash,
        bytes32 _hashLock
    )
    external
    returns (
        uint256 unlockHeight_,
        bytes32 redeemIntentHash_)
    {
        // check if the caller is whitelisted worker
        require(workers.isWorker(msg.sender));
        require(_hashLock != bytes32(0));
        require(_requestHash != bytes32(0));

        Request storage redeemRequest = redeemRequests[_requestHash];

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

        mintRequests[stakingIntentHash] = Request({
            amount: _amount,
            beneficiary: _beneficiary});

        emit StakingIntentConfirmed(uuid, intentConfirmedHash_, _staker, _beneficiary, _amount, expirationHeight_, _blockHeight, storageRoot);

    }

    function processRedeem(
        bytes32 _redemptionIntentHash,
        bytes32 _unlockSecret)
        external
        returns (address redeemer_, uint256 redeemAmount_, address beneficiary_)
    {
        require(_redemptionIntentHash != bytes32(0));
        bytes32 requestHash;

        (redeemer_, requestHash) = OpenSTProtocol.processIntentDeclaration(protocolStorage, _redemptionIntentHash, _unlockSecret);

        Request redeemRequest = redeemRequests[requestHash];
        require(redeemRequest.beneficiary != address(0));

        require(utilityToken.transfer(escrow, redeemRequest.amount));

        //If the msg.sender is whitelited worker then transfer the bounty amount to Workers contract
        //else transfer the bounty to msg.sender.
        if (workers.isWorker(msg.sender)) {
            // Transfer bounty amount to the workers contract address
            require(utilityToken.transfer(workers, bounty));
        } else {
            //Transfer bounty amount to the msg.sender account
            require(utilityToken.transfer(msg.sender, bounty));
        }
        redeemAmount_ = redeemRequest.amount;
        beneficiary_ = redeemRequest.beneficiary;
        // delete the stake request from the mapping storage
        delete redeemRequests[requestHash];

        emit ProcessedRedemption(uuid, _redemptionIntentHash, redeemer_, beneficiary_, redeemAmount_, _unlockSecret);

    }

    function revertRedemption(bytes32 _redemptionIntentHash)
        external
        returns (address redeemer_, address beneficiary_, uint256 amount_)
    {
        //todo WIP
        require(_redemptionIntentHash != bytes32(0));
        bytes32 requestHash;
        (redeemer_, requestHash) = OpenSTProtocol.revert(protocolStorage, _redemptionIntentHash);

        Request storage redeemRequest = redeemRequests[requestHash];

        // check if the redeem request exists
        require(redeemRequest.beneficiary != address(0));
        amount_ = redeemRequest.amount;
        beneficiary_ = redeemRequest.beneficiary;

        require(utilityToken.transfer(redeemer_, amount_));
        require(utilityToken.transfer(workers, bounty));

        // delete the stake request from the mapping storage
        delete redeemRequests[requestHash];

        emit RevertedRedemption(uuid, _redemptionIntentHash, redeemer_, beneficiary_, amount_);

    }

}
