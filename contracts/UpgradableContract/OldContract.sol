pragma solidity ^0.4.23;

import "./StorageState.sol";

contract OldContract is StorageState {
    uint256 constant UINT256_MIN = 0;

    constructor(){

    }

    function add(uint value) public returns (uint256){
        uint256 length = _storage.add(value);
        return length;
    }

    function length() public returns (uint){
        return _storage.length();
    }

    function findBestElement() public returns (uint256){
        uint max = UINT256_MIN;
        for (uint i = 0; i < _storage.length(); i++) {
            if (_storage.get(i) > max) {
                max = _storage.get(i);
            }
        }
        return max;
    }
}
