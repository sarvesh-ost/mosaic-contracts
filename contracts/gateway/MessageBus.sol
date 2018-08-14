pragma solidity ^0.4.0;

contract MessageBus {
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
        uint256 gasPrice;
        // signature (r, s, v) of intentHash, declaration nonce and gasPrice
        bytes32 r;
        bytes32 s;
        uint8 v;
        address sender;
        bytes32 hashLock;
    }



}
