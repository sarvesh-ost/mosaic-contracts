pragma solidity ^0.4.23;

import "./StorageState.sol";

contract NewContract is StorageState {
    uint256 constant UINT256_MAX = ~uint256(0);

    constructor(){

    }


    function add(uint value) public returns (uint256){
        uint256 length = _storage.add(value);
        return length;
    }

    function length() public returns (uint){
        return _storage.length();
    }

    function findBestElement() public returns (uint){
        uint min = UINT256_MAX;
        for (uint i = 0; i < _storage.length(); i++) {
            if (_storage.get(i) < min) {
                min = _storage.get(i);
            }
        }
        return min;
    }
}
