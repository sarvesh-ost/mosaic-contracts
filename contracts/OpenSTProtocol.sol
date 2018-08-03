pragma solidity ^0.4.23;

import "./CoGateway.sol";
import "./EIP20Interface.sol";
import "./HasherLib.sol";
import "./UtilityTokenInterface.sol";
import "./CoreInterface.sol";
import "./ProofLib.sol";
import "./MerklePatriciaProof.sol";

library OpenSTProtocol {

    struct ProtocolStorage {
        uint256 blocksToWaitShort;
        uint256 blocksToWaitLong;
        CoreInterface core;

        mapping(address /*requestHah */ => Request) requests;
        mapping(bytes32 /*intentDeclaredHash */ => IntentDeclared) intents;
        mapping(bytes32 /*intentconfirmedHash */ => IntentConfirmed) confirms;
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
        bytes32 unlockSecret;
    }


    function request(
        ProtocolStorage storage _protocolStorage,
        uint256 _amount,
        uint256 _nonce)
        internal
        returns (bytes32 requestHash_)
    {
        requestHash_ = keccak256(abi.encodePacked(msg.sender, _amount, _nonce));
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
        bytes32 _unlockSecret)
        internal
        returns (bytes32 intentConfirmHash_)
    {
        // check if the intent is declared
        IntentDeclared intentObj = _protocolStorage.intents[_intentDeclaredHash];
        require(intentObj.requestHash != address(0));

        // check if intent is not confirmed
        intentConfirmHash_ = keccak256(abi.encodePacked(_intentDeclaredHash, _unlockSecret));
        IntentConfirmed intentConfirmObj = _protocolStorage.confirms[intentConfirmHash_];
        require(intentConfirmObj.intentDeclaredHash == bytes32(0));

        _protocolStorage.confirms[intentConfirmHash_] = IntentConfirmed({
            intentDeclaredHash: _intentDeclaredHash,
            unlockSecret: _unlockSecret
            });
    }
}
