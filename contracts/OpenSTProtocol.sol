pragma solidity ^0.4.23;

import "./MerklePatriciaProof.sol";

library OpenSTProtocol {

    struct ProtocolStorage {
        uint256 blocksToWaitLong;
        uint256 blocksToWaitShort;
        mapping(bytes32 /*requestHash */ => Request) requests;
        mapping(bytes32 /*intentHash */ => IntentDeclared) intents;
        mapping(bytes32 /*intentConfirm */ => IntentConfirmed) confirmations;
    }


    struct Request {
        address requester;
        uint256 nonce;
        bytes32 data;
    }

    struct IntentDeclared {
        bytes32 requestHash;
        bytes32 hashLock;
        uint256 unlockHeight;
    }

    struct IntentConfirmed {
        bytes32 intentDeclaredHash;
        bytes32 hashLock;
        uint256 expirationHeight;
    }


    function request(
        ProtocolStorage storage _protocolStorage,
        uint256 _nonce,
        bytes32 _data)
        internal
        returns (bytes32 requestHash_)
    {
        requestHash_ = keccak256(abi.encodePacked(msg.sender, _nonce, _data));
        Request obj = _protocolStorage.requests[requestHash_];

        require(obj.requester != address(0));

        _protocolStorage.requests[requestHash_] = Request({
            requester: msg.sender,
            nonce: _nonce,
            data : _data
            });
    }

    function declareIntent(
        ProtocolStorage storage _protocolStorage,
        bytes32 _requestHash,
        bytes32 _hashLock)
        internal
    returns (bytes32 intentDeclaredHash_, uint256 unlockHeight)
    {
        // check if the request obj exists
        Request requestObj = _protocolStorage.requests[_requestHash];
        require(requestObj.requester != address(0));

        // check if intent is not already declared
        intentDeclaredHash_ = keccak256(abi.encodePacked(_requestHash, _hashLock));
        IntentDeclared intentObj = _protocolStorage.intents[intentDeclaredHash_];
        require(intentObj.requestHash == bytes32(0));

        unlockHeight = block.number + _protocolStorage.blocksToWaitLong;

        _protocolStorage.intents[intentDeclaredHash_] = IntentDeclared({
            requestHash: _requestHash,
            hashLock : _hashLock,
            unlockHeight : unlockHeight
            });
    }


    function confirmIntent(
        ProtocolStorage storage _protocolStorage,
        bytes32 _intentDeclaredHash,
        bytes32 _hashLock,
        bytes32 _storageRoot,
        uint256 _blockHeight,
        bytes _path,
        bytes _rlpParentNodes
        )
        internal
    returns (bytes32 intentConfirmHash_, uint256 expirationHeight_)
    {
        // check if the intent is declared
        require(MerklePatriciaProof.verify(keccak256(abi.encodePacked(_intentDeclaredHash)), _path, _rlpParentNodes, _storageRoot));

        intentConfirmHash_ = keccak256(_intentDeclaredHash, _hashLock);

        expirationHeight_ = block.number + _protocolStorage.blocksToWaitShort;

        _protocolStorage.confirmations[_intentDeclaredHash] = IntentConfirmed({
            intentDeclaredHash : _intentDeclaredHash,
            hashLock : _hashLock,
            expirationHeight : expirationHeight_
            });
    }

    function processIntentDeclaration(
        ProtocolStorage storage _protocolStorage,
        bytes32 _intentHash,
        bytes32 _unlockSecret
    )
    internal
    returns (bytes32 requestHash)
    {
        //todo check height
        IntentDeclared intentDeclared = _protocolStorage.intents[_intentHash];
        requestHash = intentDeclared.requestHash;

        require(requestHash != bytes32(0));
        require(intentDeclared.hashLock != bytes32(0));

        require(intentDeclared.hashLock == keccak256(abi.encodePacked(_unlockSecret)));

        delete _protocolStorage.requests[requestHash];
        delete _protocolStorage.intents[_intentHash];
    }

    function processIntentConfirmation(
        ProtocolStorage storage _protocolStorage,
        bytes32 _intentConfirmationHash,
        bytes32 _unlockSecret
    )
    internal
    returns (bool /*success*/)
    {
        //todo check height
        IntentConfirmed intentConfirmation = _protocolStorage.confirmations[_intentConfirmationHash];
        require(intentConfirmation.hashLock != bytes32(0));

        require(intentConfirmation.hashLock == keccak256(abi.encodePacked(_unlockSecret)));
        delete _protocolStorage.confirmations[_intentConfirmationHash];
    }

    function revert(
        ProtocolStorage storage _protocolStorage,
        bytes32 _intentDeclaredHash
    )
    returns (address requester,
        bytes32 requestHash
    )
    {
        requestHash = _protocolStorage.intents[_intentDeclaredHash].requestHash;

        require(_protocolStorage.intents[_intentDeclaredHash].hashLock == bytes32(0));
        require(_protocolStorage.requests[requestHash].requester == bytes32(0));

        requester = _protocolStorage.requests[requestHash].requester;

        delete _protocolStorage.requests[requestHash];
        delete _protocolStorage.intents[_intentDeclaredHash];
    }

    function requestRevert(
        ProtocolStorage storage _protocolStorage,
        bytes32 requestHash
    )
    {
        require(_protocolStorage.requests[requestHash].requester != address(0));
        //todo require intent not declared
        delete _protocolStorage.requests[requestHash];
    }

}
