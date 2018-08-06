pragma solidity ^0.4.23;

import "./MerklePatriciaProof.sol";

library OpenSTProtocol {

    struct ProtocolStorage {
        mapping(address /*requestHash */ => Request) requests;
        mapping(bytes32 /*intentDeclaredHash */ => IntentDeclared) intents;
        mapping(bytes32 /*intentConfirm */ => IntentConfirmed) confirmations;
    }


    struct Request {
        address requester;
        uint256 nonce;
    }

    struct IntentDeclared {
        bytes32 requestHash;
        bytes32 hashLock;
    }

    struct IntentConfirmed {
        bytes32 intentDeclaredHash;
        bytes32 hashLock;
    }


    function request(
        ProtocolStorage storage _protocolStorage,
        uint256 _nonce)
        internal
        returns (bytes32 requestHash_)
    {
        requestHash_ = keccak256(abi.encodePacked(msg.sender, _nonce));
        Request obj = _protocolStorage.requests[requestHash_];

        require(obj.requester != address(0));

        _protocolStorage.requests[requestHash_] = Request({
            requester: msg.sender,
            nonce: _nonce
            });
    }

    function declareIntent(
        ProtocolStorage storage _protocolStorage,
        bytes32 _requestHash,
        bytes32 _hashLock)
        internal
        returns (bytes32 intentDeclaredHash_)
    {
        // check if the request obj exists
        Request requestObj = _protocolStorage.requests[_requestHash];
        require(requestObj.requester != address(0));

        // check if intent is not already declared
        intentDeclaredHash_ = keccak256(abi.encodePacked(_requestHash, _hashLock));
        IntentDeclared intentObj = _protocolStorage.intents[intentDeclaredHash_];
        require(intentObj.requestHash == bytes32(0));

        _protocolStorage.intents[intentDeclaredHash_] = IntentDeclared({
            requestHash: _requestHash,
            hashLock: _hashLock
            });
    }


    function confirmIntent(
        ProtocolStorage storage _protocolStorage,
        bytes32 _intentDeclaredHash,
        bytes32 _storageRoot,
        bytes32 _path,
        bytes _rlpParentNodes,
        bytes32 _hackLock)
        internal
        returns (bytes32 intentConfirmHash_)
    {
        // check if the intent is declared
        require(MerklePatriciaProof.verify(keccak256(abi.encodePacked(_intentDeclaredHash)), _path, _rlpParentNodes, _storageRoot));

        intentConfirmHash_ = keccak256(_intentDeclaredHash, _hackLock);

        confirmations[_intentDeclaredHash] = IntentConfirmed({
            intentDeclaredHash : _intentDeclaredHash,
            hashLock : _hackLock
            });
        return intentConfirmHash_;
    }

    function processIntent(
        ProtocolStorage storage _protocolStorage,
        bytes32 _intentDeclaredHash,
        bytes32 _unlockSecret
    )
    internal
    returns (address requester, bytes32 requestHash)
    {
        IntentDeclared intentDeclared = _protocolStorage.intents[_intentDeclaredHash];
        requestHash = intentDeclared.requestHash;

        require(requestHash != bytes(0));
        require(intentDeclared.hashLock != bytes(0));

        require(intentDeclared.hashLock == keccak256(abi.encodePacked(_unlockSecret)));

        requester = _protocolStorage.requests[requestHash].requester;

        delete _protocolStorage.requests[requestHash];
        delete _protocolStorage.intents[_intentDeclaredHash];
    }
}
