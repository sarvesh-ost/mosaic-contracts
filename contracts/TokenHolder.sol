pragma solidity ^0.4.23;

contract TokenHolder {
    bytes32 secret;
    mapping(address => bool) devices;
    mapping(address => mapping(bytes32 => bool)) usedSigs;


    function addDevice(address device) returns (bool){
        devices[device] = true;
        return true;
    }


    function startSession(bytes32 sessionSecret) returns (bool){
        secret = sessionSecret;
        return true;
    }

    function validateSession_1(bytes32 newScret) returns (bool){
        require(sha3(newScret) == secret);
        secret = newScret;
        return true;
    }

    function validateSession_2(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) returns (bool) {
        address _addr = ecrecover(msgHash, v, r, s);
        require(devices[_addr] == true);
        require(usedSigs[_addr][msgHash] == false);
        usedSigs[_addr][msgHash] = true;
        return true;
    }

}
