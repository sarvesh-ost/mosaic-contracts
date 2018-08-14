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
        Message storage _message
    )
    external
    returns (bytes32 messageHash_)
    {
        messageHash_ = messageDigest(_messageTypeHash, _message);

        //todo intent hash is part of message hash and it's signed how? it's generate here only
        require(_message.sender == ecrecover(messageHash_, _message.v, _message.r, _message.s));
        require(_messageBox.outbox[messageHash_] == MessageStatus.Undeclared);

        _messageBox.outbox[messageHash_] = MessageStatus.Declared;
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
