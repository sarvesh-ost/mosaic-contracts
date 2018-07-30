pragma solidity ^0.4.23;

import "./SafeMath.sol";
import "./EIP20Token.sol";
import "./Owned.sol";
import "./FunctionalActor.sol";

contract ValueToken is EIP20Token, Owned {
    FunctionalActor functionalActors;

    modifier onlyFunctionalActor() {
        require(functionalActors.isFunctionalActor(msg.sender));
        _;
    }

    constructor(
        string _symbol,
        string _name,
        uint8 _decimals,
        FunctionalActor _functionalActors)
        public
        EIP20Token(_symbol, _name, _decimals)
    {
        tokenSymbol      = _symbol;
        tokenName        = _name;
        tokenDecimals    = _decimals;
        functionalActors = _functionalActors;
    }


    function transfer(
        address _to,
        uint256 _value)
        public
        onlyFunctionalActor
        returns (bool success) {
        return super.transfer(_to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value)
        public
        returns (bool success)
    {
        require(functionalActors.isFunctionalActor(_to));
        return super.transferFrom(_from, _to, _value);
    }

    function mint(uint256 _amount)
        internal
        onlyFunctionalActor
        returns (bool /* success */) {
        return mintEIP20(_amount);
    }

    function burn(uint256 _amount)
        internal
        onlyFunctionalActor
        returns (bool /* success */)
    {
        return burnEIP20(_amount);
    }
}
