pragma solidity ^0.4.23;

import "./StorageState.sol";
import "./OpsManaged.sol";

contract Proxy is StorageState, OpsManaged {

    event ImplementationUpgraded(address indexed implementation);

    constructor(ContractStorage storage_) public
    OpsManaged()
    {
        _storage = storage_;
    }

    address public _implementation;

    function implementation() public view returns (address) {
        return _implementation;
    }

    function upgradeTo(address impl) public onlyOwner {
        require(_implementation != impl);
        _implementation = impl;
        ImplementationUpgraded(impl);
    }

    function() payable public {
        address _impl = implementation();
        require(_impl != address(0));
        bytes memory data = msg.data;

        assembly {
            let result := delegatecall(gas, _impl, add(data, 0x20), mload(data), 0, 0)
            let size := returndatasize
            let ptr := mload(0x40)
            returndatacopy(ptr, 0, size)
            switch result
            case 0 {revert(ptr, size)}
            default {return (ptr, size)}
        }
    }

}