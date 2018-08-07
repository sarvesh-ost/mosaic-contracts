pragma solidity ^0.4.23;

import "./ProtocolVersioned.sol";
import "./Owned.sol";
import "./OpenSTProtocol.sol";
import "./WorkersInterface.sol";
import "./UtilityTokenInterface.sol";

contract CoGateway is ProtocolVersioned, Owned {

    event RedeemRequested(address _redeemer, uint256 _amount, address _beneficiary, uint256 _nonce, bytes32 _requestHash);

    mapping(bytes32 /*requestHash */ => RedeemRequest) public redeemRequests;

    mapping(address /*account */ => uint256) public nonces;

    UtilityTokenInterface public utilityToken;

    OpenSTProtocol.ProtocolStorage protocolStorage;

    struct RedeemRequest {
        uint256 amount;
        address beneficiary;
    }



    function requestRedeem(
        uint256 _amount,
        address _beneficiary)
        external
        returns (
            uint256 nonce_,
            bytes32 requestHash_)
    {
        require(_amount > uint256(0));
        require(_beneficiary != address(0));

        nonce_ = nonces[msg.sender]++;
        requestHash_ = OpenSTProtocol.request(protocolStorage, nonce);
        // check if the redeem request does not exists
        require(redeemRequests[requestHash].beneficiary == address(0));

        require(utilityToken.transferFrom(msg.sender, address(this), _amount));

        redeemRequests[requestHash] = RedeemRequest({
            amount: _amount,
            beneficiary: _beneficiary});

        emit RedeemRequested(msg.sender, _amount, _beneficiary, _nonce, requestHash);

    }


    function revertRedeemRequest(bytes32 _requestHash) external returns (uint256 redeemRequestAmount_) {

        RedeemRequest storage redeemRequest = redeemRequests[msg.sender];

        // check if the stake request exists for the msg.sender
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(msg.sender, stakeRequest.amount));

        stakeRequestAmount = stakeRequest.amount;
        delete stakeRequests[msg.sender];

        emit StakeRequestReverted(msg.sender, stakeRequestAmount);

        return stakeRequestAmount;
    }

    function confirmStakingIntent(
        //bytes32 _uuid,
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _unlockHeight,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes _rlpParentNodes)
        external
    {
        bytes32 data = keccak256(abi.encodePacked(_amount, _beneficiary));
        bytes32 requestHash = keccak256(abi.encodePacked(_staker, _stakerNonce, data));
        bytes32 intentDeclaredHash = keccak256(abi.encodePacked(requestHash, _unlockHeight, _hashLock));

        //bytes32 path = CoreInterface.storagepath
        bytes32 intentConfirmedHash = OpenSTProtocol.confirmIntent(protocolStorage, requestHash, _hashLock, _storageRoot, _blockHeight, _blockHeight, _path, _rlpParentNodes);

        require(intentConfirmedHash == intentDeclaredHash);

    }
}
