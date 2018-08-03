pragma solidity ^0.4.23;

import "./MerklePatriciaProof.sol";

library OpenSTProtocol {

    struct ProtocolStorage {
        mapping(address /*requestHash */ => Request) requests;
        mapping(bytes32 /*intentDeclaredHash */ => IntentDeclared) intents;
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
        bytes32 storageRoot,
        bytes32 path,
        bytes rlpParentNodes)
        internal
        returns (bytes32 intentConfirmHash_)
    {

        // check if the intent is declared
        return MerklePatriciaProof.verify(keccak256(abi.encodePacked(_intentDeclaredHash)), path, rlpParentNodes, storageRoot);

    }

    function processIntent(
        ProtocolStorage storage _protocolStorage,
        bytes32 _intentDeclaredHash
    )
    internal
    returns (bool /*success*/)
    {
        IntentDeclared intentDeclared = _protocolStorage.intents[_intentDeclaredHash];
        bytes32 requestHash = intentDeclared.requestHash;
        
        delete _protocolStorage.requests[requestHash];
        delete _protocolStorage.intents[_intentDeclaredHash];

    }
}
