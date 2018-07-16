pragma solidity ^0.4.23;

contract VerifyECRecover {


    function isSigned(address _addr, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) returns (bool) {
        bool isVerified = ecrecover(msgHash, v, r, s) == _addr;
        return isVerified;
    }
}
