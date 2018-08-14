pragma solidity ^0.4.23;

import "./ValueToken.sol"; // this will be interface.
import "../SafeMath.sol";
import "../ProtocolVersioned.sol";

contract BrandedTokenStake is ProtocolVersioned {
	using SafeMath for uint256;

	event ReleasedStake(address indexed _protocol, address indexed _to, uint256 _amount);
	ValueToken public valueToken;

	constructor(
		ValueToken _valueToken,
		address _gatewayProtocol)
		ProtocolVersioned(_gatewayProtocol)
		public
	{
		valueToken = _valueToken;
	}

	function releaseTo(address _to, uint256 _amount)
		public 
		onlyProtocol
		returns (bool)
	{
		require(_to != address(0));
		require(valueToken.transfer(_to, _amount));
		
		emit ReleasedStake(msg.sender, _to, _amount);

		return true;
	}

	 function getTotalStake()
		public
		view
		returns (uint256)
		{
		return valueToken.balanceOf(this);
	}
}