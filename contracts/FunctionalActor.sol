pragma solidity ^0.4.23;

import "./SafeMath.sol";
import "./Owned.sol";

contract FunctionalActor is Owned {
    using SafeMath for uint256;

    mapping(address => uint256 /* deactivation height */) public functionalActors;

    event FunctionalActorSet(
        address indexed _address,
        uint256 indexed _deactivationHeight,
        uint256 _remainingHeight);

    event FunctionalActorRemoved(
        address indexed _address,
        bool _existed);

    constructor() public Owned() {}

    function setFunctionalActor(
        address _address,
        uint256 _deactivationHeight)
        external
        onlyOwner()
        returns (uint256 /* remaining activation length */)
    {
        require(_address != address(0));
        require(_deactivationHeight >= block.number);

        functionalActors[_address] = _deactivationHeight;
        uint256 remainingHeight = _deactivationHeight.sub(block.number);

        emit FunctionalActorSet(_address, _deactivationHeight, remainingHeight);

        return (remainingHeight);
    }

    function removeFunctionalActor(address _address)
        external
        onlyOwner()
        returns (bool existed)
    {
        existed = (functionalActors[_address] > 0);

        delete functionalActors[_address];
        emit FunctionalActorRemoved(_worker, existed);

        return existed;
    }

    function remove()
        external
        onlyOwner()
    {
        selfdestruct(msg.sender);
    }

    function isFunctionalActor(
        address _address)
        external
        view
        returns (bool)
    {
        return (functionalActors[_address] >= block.number);
    }

}