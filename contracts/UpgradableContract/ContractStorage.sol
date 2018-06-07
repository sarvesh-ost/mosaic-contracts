pragma solidity ^0.4.23;


contract ContractStorage {

    uint256[] public data;


    function add(uint256 value) public returns (uint256){

        data.push(value);
        return data.length;
    }

    function get(uint index) public returns (uint256){
        require(index < data.length, "Out of Index");
        return data[index];
    }

    function length() public returns (uint256){
        return data.length;
    }

}
