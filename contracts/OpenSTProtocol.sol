pragma solidity ^0.4.23;

import "./CoGateway.sol";
import "./EIP20Interface.sol";
import "./HasherLib.sol";
import "./UtilityTokenInterface.sol";

library OpenSTProtocol {


    //Todo Staker, redeemer, SimpleStake, BrandedToken address should be in this storage?
    struct ProtocolStorage {
        uint256 blocksToWaitShort;
        uint256 blocksToWaitLong;
        address stakeAddress; //simple stake or Branded Token stake //todo discuss if ost needs to transfer to simple stake
        mapping(address => uint256) nonces;
        //request stakes and request redeem
        mapping(address /*converter */ => ConversionRequest) conversionRequests;
        //stakes and redeem
        mapping(bytes32 /*intentHash */ => Conversion) conversions;
        mapping(bytes32 => bytes32) intents;
    }

    struct Conversion {
        bytes32 uuid;
        address converter;
        address beneficiary;
        uint256 nonce;
        uint256 amount;
        uint256 unlockHeight;
        bytes32 hashLock;
    }


    struct ConversionRequest {
        uint256 amount;
        uint256 unlockHeight;
        address beneficiary;
        bytes32 hashLock;
    }

    /* accept stake or accept redeem*/
    function requestConversion(
        ProtocolStorage storage _protocolStorage,
        address _brandedToken,
        uint256 _amount,
        address _beneficiary)
    internal
    returns (bool /* success*/){

        //todo  duplicate
        //require(EIP20Interface(_brandedToken).transferFrom(msg.sender, address(this), _amount));

        _protocolStorage.conversionRequests[msg.sender] = ConversionRequest({
            amount : _amount,
            beneficiary : _beneficiary,
            hashLock : 0,
            unlockHeight : 0
            });
        return true;
    }

    function acceptConversion(
        ProtocolStorage storage _protocolStorage,
        bytes32 uuid,
        address _brandedToken,
        uint256 _bounty,
        address _converter
    )
    returns (uint256, uint256, uint256, bytes32, bytes32)
    {
        ConversionRequest storage conversionRequest = _protocolStorage.conversionRequests[_converter];

        require(EIP20Interface(_brandedToken).transferFrom(msg.sender, address(this), _bounty));
        return conversionIntent(_protocolStorage, _brandedToken, uuid, conversionRequest.amount, conversionRequest.beneficiary, conversionRequest.hashLock, _converter);
    }

    //stake and redeem
    function conversionIntent(
        ProtocolStorage storage _protocolStorage,
        address _brandedToken,
        bytes32 _uuid,
        uint256 _amount,
        address _beneficiary,
        bytes32 _hashLock,
        address _converter
    )
    returns (uint256, uint256 nonce, uint256 unlockHeight, bytes32 intentHash, bytes32 intentKeyHash){


        require(EIP20Interface(_brandedToken).transferFrom(_converter, address(this), _amount));
        unlockHeight = block.number + _protocolStorage.blocksToWaitLong;

        _protocolStorage.nonces[_converter]++;
        nonce = _protocolStorage.nonces[_converter];

        intentHash = HasherLib.hashConversionIntent(
            _uuid,
            _converter,
            nonce,
            _beneficiary,
            _amount,
            unlockHeight,
            _hashLock
        );

        _protocolStorage.conversions[intentHash] = Conversion({
            uuid : _uuid,
            converter : _converter,
            beneficiary : _beneficiary,
            nonce : nonce,
            amount : _amount,
            unlockHeight : unlockHeight,
            hashLock : _hashLock
            });

        // store the staking intent hash directly in storage of OpenSTValue
        // so that a Merkle proof can be generated for active staking intents
        intentKeyHash = HasherLib.hashIntentKey(_converter, nonce);
        _protocolStorage.intents[intentKeyHash] = intentHash;

        return (_amount, nonce, unlockHeight, intentHash, intentKeyHash);
    }

    function processConversion(
        ProtocolStorage storage _protocolStorage,
        address _brandedToken,
        bytes32 _conversionIntent,
        bytes32 _unlockSecret
    )
    returns (
        address converter,
        uint256 amount
    ){
        Conversion storage conversion = _protocolStorage.conversions[_conversionIntent];
        require(conversion.hashLock == keccak256(abi.encodePacked(_unlockSecret)));
        //Todo check if staker address is defined then it can only process

        require(EIP20Interface(_brandedToken).transfer(_protocolStorage.stakeAddress, conversion.amount));
         //Todo Stake and mint has different implementation
        converter = conversion.converter;
        amount = conversion.amount;
        require(UtilityTokenInterface(_brandedToken).burn(converter, amount));


        delete _protocolStorage.intents[HasherLib.hashIntentKey(conversion.converter, conversion.nonce)];
        delete _protocolStorage.conversions[_conversionIntent];
        return (converter, amount);
    }



    function rejectConversion(){

    }

    function revertConversion(){

    }

    function confirmConversionIntent(){

    }

    function mint(){

    }

    function unstake(){

    }


}
