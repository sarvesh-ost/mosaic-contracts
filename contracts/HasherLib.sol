pragma solidity 0.4.23;

library HasherLib {

    function hashConversionIntent(
        bytes32 _uuid,
        address _account,
        uint256 _accountNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _unlockHeight,
        bytes32 _hashLock)
    public
    pure
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _uuid,
                _account,
                _accountNonce,
                _beneficiary,
                _amount,
                _unlockHeight,
                _hashLock));
    }

    /**
     *  @notice Public pure function.
     *
     *  @param _account Address of the hashing account.
     *  @param _nonce Nonce of the hashing account.
     *
     *  @return bytes32 Keccak256 intent key hash.
     */
    function hashIntentKey(
        address _account,
        uint256 _nonce)
    public
    pure
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _account,
                _nonce));
    }
}
