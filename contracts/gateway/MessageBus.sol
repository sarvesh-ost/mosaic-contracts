pragma solidity ^0.4.23;

library MessageBus {
    enum MessageStatus {
        Undeclared,
        Declared,
        Progressed,
        Completed,
        DeclaredRevocation,
        Revoked
    }

    struct MessageBox {
        mapping (bytes32 /* messageHash */ => MessageStatus) outbox;
        mapping (bytes32 /* messageHash */ => MessageStatus) inbox;
    }

    struct Message {
        bytes32 requestHash;
        // hash digest of intent message
        bytes32 intentHash;
        uint256 nonce;
        //todo removing gas price for now
        //uint256 gasPrice;
        // signature (r, s, v) of intentHash, declaration nonce and gasPrice
        bytes32 r;
        bytes32 s;
        uint8 v;
        address sender;
        bytes32 hashLock;
    }

    function declareMessage(
        MessageBox storage _messageBox,
        bytes32 _messageTypeHash,
        bytes32 _requestHash,
        Message storage _message
    )
    public
    returns (bytes32 messageHash_)
    {

        messageHash_ = messageDigest(_messageTypeHash, _message);

        //todo intent hash is part of message hash and it's signed how? it's generate here only
        require(_message.sender == ecrecover(_requestHash, _message.v, _message.r, _message.s));
        require(_messageBox.outbox[messageHash_] == MessageStatus.Undeclared);

        _messageBox.outbox[messageHash_] = MessageStatus.Declared;
    }

    //todo move path generation logic inside library
    function confirmMessage(
        MessageBox storage _messageBox,
        bytes32 storage _messageTypeHash,
        bytes32 _requestHash,
        Message storage _message,
        bytes _rlpEncodedParentNodes,
        uint256 _outboxOffset,
        bytes32 _storageRoot
    )
    {
        messageHash_ = messageDigest(_messageTypeHash, _message);
        require(_message.sender == ecrecover(_requestHash, _message.v, _message.r, _message.s));
        require(_messageBox.inbox[messageHash_] == MessageStatus.Undeclared);

        bytes memory path = ProofLib.bytes32ToBytes(
            ProofLib.storageVariablePath(_outboxOffset, messageHash));

        require(MerklePatriciaProof.verify(
                keccak256(abi.encodePacked(_message.intentHash)),
                _path,
                _rlpEncodedParentNodes,
                _storageRoot)
        );
        _messageBox.inbox[messageHash_] = MessageStatus.Declared;
    }


    function processOutbox(
        MessageBox storage _messageBox,
        bytes32 storage _messageTypeHash,
        Message storage _message,
        bytes32 _unlockSecret
    )
    returns (bool /*success*/)
    {
        require(_unlockSecret == keccak256(abi.encode(_message.hashLock)));
        messageHash_ = messageDigest(_messageTypeHash, _message);
        _messageBox.outbox[messageHash_] = MessageStatus.Progressed;

        return true;
    }


    function processInbox(
        MessageBox storage _messageBox,
        bytes32 storage _messageTypeHash,
        Message storage _message,
        bytes32 _unlockSecret
    )
    returns (bool /*success*/)
    {
        require(_unlockSecret == keccak256(abi.encode(_message.hashLock)));
        messageHash_ = messageDigest(_messageTypeHash, _message);
        _messageBox.inbox[messageHash_] = MessageStatus.Progressed;
        return true;
    }




    function messageDigest(
        bytes32 _messageTypeHash,
        Message _message
    )
    internal
    pure
    returns (bytes32 /* messageHash */)
    {
        return keccak256(
            abi.encode(
                _messageTypeHash,
                _message.intentHash,
                _message.nonce//,
            //_message.gasPrice
            )
        );
    }


}
