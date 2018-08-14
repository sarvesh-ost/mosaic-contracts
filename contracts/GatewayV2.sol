/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.23;

// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// Value chain: Gateway
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./ProtocolVersioned.sol";
import "./OpenSTValueInterface.sol";
import "./EIP20Interface.sol";
import "./Owned.sol";
import "./WorkersInterface.sol";
import "./OpenSTProtocol.sol";
import "./Hasher.sol";
import "./ProofLib.sol";
import "./CoreInterface.sol";

/**
 *  @title Gateway contract which implements ProtocolVersioned, Owned.
 *
 *  @notice Gateway contract is staking Gateway that separates the concerns of staker and staking processor.
 *          Stake process is executed through Gateway contract rather than directly with the protocol contract.
 *          The Gateway contract will serve the role of staking account rather than an external account.
 */
contract Gateway is ProtocolVersioned, Owned, Hasher {

    /** Events */

    /** Below event is emitted after successful execution of requestStake */
    event StakeRequested(bytes32 requestHash, uint256 _amount, address _beneficiary);
    /** Below event is emitted after successful execution of revertStakeRequest */
    event StakeRequestReverted(address _staker, uint256 _amount);
    /** Below event is emitted after successful execution of rejectStakeRequest */
    event StakeRequestRejected(address _staker, uint256 _amount, uint8 _reason);
    /** Below event is emitted after successful execution of acceptStakeRequest */
    event StakeRequestAccepted(
        address _staker,
        uint256 _amount,
        uint256 _nonce,
        uint256 _unlockHeight,
        bytes32 _stakingIntentHash);

    event ProcessedStaking(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash, address _staker, address _beneficiary, uint256 _amount, bytes32 _unlockSecret);


    event RevertedStake(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash, address _staker, uint256 _amount);
    event RedemptionIntentConfirmed(bytes32 indexed _uuid, bytes32 _redemptionIntentHash,
        address _redeemer, address _beneficiary, uint256 _amount, uint256 _expirationHeight);
    /** Below event is emitted after successful execution of setWorkers */
    event WorkersSet(WorkersInterface _workers);

    /** Storage */

    /** Storing stake requests */
    mapping(bytes32 /*requestHash */ => StakeRequest) public stakeRequests;
    mapping(address/*staker*/ => uint256) public nonces;
    /** Storing workers contract address */
    WorkersInterface public workers;
    /** Storing bounty amount that will be used while accepting stake */
    uint256 public bounty;
    /** Storing utility token UUID */
    bytes32 public uuid;
    address stakeAddress;
    address brandedToken;
    OpenSTProtocol.ProtocolStorage protocolStorage;
    CoreInterface core;
    uint8 intentsMappingStorageIndexPosition = 4;

    /** Structures */

    struct StakeRequest {
        uint256 amount;
        address beneficiary;
    }

    /** Public functions */

    /**
     *  @notice Contract constructor.
     *
     *  @param _workers Workers contract address.
     *  @param _bounty Bounty amount that worker address stakes while accepting stake request.
     *  @param _uuid UUID of utility token.
     *  @param _openSTProtocol OpenSTProtocol address contract that governs staking.
     */
    constructor(
        WorkersInterface _workers,
        uint256 _bounty,
        bytes32 _uuid,
        address _openSTProtocol)
    public
    Owned()
    ProtocolVersioned(_openSTProtocol)
    {
        require(_workers != address(0));
        require(_uuid.length != uint8(0));

        workers = _workers;
        bounty = _bounty;
        uuid = _uuid;

    }

    /**
     *  @notice External function requestStake.
     *
     *  @dev In order to request stake the staker needs to approve Gateway contract for stake amount.
     *       Staked amount is transferred from staker address to Gateway contract.
     *
     *  @param _amount Staking amount.
     *  @param _beneficiary Beneficiary address.
     *
     *  @return bool Specifies status of the execution.
     */
    function requestStake(
        uint256 _amount,
        address _beneficiary
    )
    external
    returns (bool /* success */)
    {
        require(_amount > uint256(0));
        require(_beneficiary != address(0));

        nonces[msg.sender]++;
        uint256 nonce = nonces[msg.sender];

        bytes32 data = keccak256(abi.encodePacked(_amount, _beneficiary));

        bytes32 requestHash = OpenSTProtocol.request(protocolStorage, nonce, data);
        // check if the stake request does not exists
        require(stakeRequests[requestHash].beneficiary == address(0));

        require(EIP20Interface(brandedToken).transferFrom(msg.sender, address(this), _amount));

        stakeRequests[requestHash] = StakeRequest({
            amount : _amount,
            beneficiary : _beneficiary
            });
        emit StakeRequested(requestHash, _amount, _beneficiary);

        return true;
    }

    /**
     *  @notice External function to accept requested stake.
     *
     *  @dev This can be called only by whitelisted worker address.
     *       Bounty amount is transferred from msg.sender to Gateway contract.
     *       openSTProtocol is approved for staking amount by Gateway contract.
     *
     *  @param requestHash request Hash
     *  @param _hashLock Hash lock.
     *
     *  @return amountUT Branded token amount.
     *  @return nonce Staker nonce count.
     *  @return unlockHeight Height till what the amount is locked.
     *  @return stakingIntentHash Staking intent hash.
     */
    function acceptStakeRequest(
        bytes32 requestHash,
        bytes32 _hashLock
    )
    external
    returns (
        uint256 amount,
        uint256 unlockHeight,
        bytes32 stakingIntentHash
    )
    {
        // check if the caller is whitelisted worker
        require(workers.isWorker(msg.sender));

        StakeRequest storage stakeRequest = stakeRequests[requestHash];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));

        // check if _hashLock is not 0
        require(_hashLock != bytes32(0));

        // Transfer bounty amount from worker to Gateway contract
        require(EIP20Interface(brandedToken).transferFrom(msg.sender, address(this), bounty));

        (stakingIntentHash, unlockHeight) = OpenSTProtocol.declareIntent(protocolStorage, requestHash, _hashLock);

        emit StakeRequestAccepted(protocolStorage.requests[requestHash].requester, stakeRequest.amount, protocolStorage.requests[requestHash].nonce, unlockHeight, stakingIntentHash);

        return (stakeRequest.amount, unlockHeight, stakingIntentHash);
    }


    /**
     *  @notice External function to process staking.
     *
     *  @dev Bounty amount is transferred to msg.sender if msg.sender is not a whitelisted worker.
     *       Bounty amount is transferred to workers contract if msg.sender is a whitelisted worker.
     *
     *  @param _stakingIntentHash Staking intent hash.
     *  @param _unlockSecret Unlock secret.
     *
     *  @return stakeRequestAmount Stake amount.
     */
    function processStaking(
        bytes32 _stakingIntentHash,
        bytes32 _unlockSecret
    )
    external
    returns (uint256 stakeRequestAmount)
    {
        require(_stakingIntentHash != bytes32(0));
        bytes32 requestHash;
        address requester;

        (requester, requestHash) = OpenSTProtocol.processIntentDeclaration(protocolStorage, _stakingIntentHash, _unlockSecret);

        StakeRequest stakeRequest = stakeRequests[requestHash];
        require(stakeRequest.amount != 0);

        require(EIP20Interface(brandedToken).transfer(stakeAddress, stakeRequest.amount));

        //If the msg.sender is whitelited worker then transfer the bounty amount to Workers contract
        //else transfer the bounty to msg.sender.
        if (workers.isWorker(msg.sender)) {
            // Transfer bounty amount to the workers contract address
            require(EIP20Interface(brandedToken).transfer(workers, bounty));
        } else {
            //Transfer bounty amount to the msg.sender account
            require(EIP20Interface(brandedToken).transfer(msg.sender, bounty));
        }
        stakeRequestAmount = stakeRequest.amount;
        // delete the stake request from the mapping storage
        emit ProcessedStaking(uuid, _stakingIntentHash, requester, stakeRequest.beneficiary, stakeRequest.amount, _unlockSecret);
        delete stakeRequests[requestHash];
        return stakeRequestAmount;
    }

    /**
     *  @notice External function to revert staking.
     *
     *  @dev Staked amount is transferred to the staker address.
     *       Bounty amount is transferred to workers contract.
     *
     *  @param _stakingIntentHash Staking intent hash.
     *
     *  @return stakeRequestAmount Staking amount.
     */
    function revertStaking(bytes32 _stakingIntentHash)
    external
    returns (uint256 amount)
    {
        //todo WIP
        require(_stakingIntentHash != bytes32(0));
        address staker;
        bytes32 requestHash;
        (staker, requestHash) = OpenSTProtocol.revert(protocolStorage, _stakingIntentHash);

        StakeRequest storage stakeRequest = stakeRequests[requestHash];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));
        amount = stakeRequest.amount;

        require(EIP20Interface(brandedToken).transfer(staker, stakeRequest.amount));
        require(EIP20Interface(brandedToken).transfer(workers, bounty));

        // delete the stake request from the mapping storage
        delete stakeRequests[requestHash];

        emit RevertedStake(uuid, _stakingIntentHash, staker, amount);
        return amount;
    }

    function revertStakeRequest(bytes32 _requestHash)
    external
    returns (uint256 amount)
    {
        require(_requestHash != bytes32(0));

        address staker = OpenSTProtocol.revertRequest(protocolStorage, _requestHash);

        StakeRequest storage stakeRequest = stakeRequests[_requestHash];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));
        amount = stakeRequest.amount;

        require(EIP20Interface(brandedToken).transfer(staker, stakeRequest.amount));

        // delete the stake request from the mapping storage
        delete stakeRequests[_requestHash];

        emit StakeRequestReverted(staker, amount);

        return amount;
    }


    function confirmRedemptionIntent(
        address _redeemer,
        uint256 _redeemerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _unlockHeight,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes _rlpParentNodes)
    external
    returns (
        bytes32 intentConfirmedHash_,
        uint256 expirationHeight_)
    {
        //bytes32 data = keccak256(abi.encodePacked(_amount, _beneficiary));
        // bytes32 requestHash = keccak256(abi.encodePacked(_redeemer, _redeemerNonce, data));
        bytes32  redemptionIntentHash = makeRedemptionIntentHash(_amount, _beneficiary, _redeemer, _redeemerNonce, _unlockHeight, _hashLock);
        //keccak256(abi.encodePacked(requestHash, _unlockHeight, _hashLock));

        bytes memory path = ProofLib.bytes32ToBytes(
            ProofLib.storageVariablePath(intentsMappingStorageIndexPosition,
            keccak256(abi.encodePacked(_redeemer, _redeemerNonce)))
        );

        bytes32 storageRoot = core.getStorageRoot(_blockHeight);

        require(storageRoot != bytes32(0));

        (intentConfirmedHash_, expirationHeight_) = OpenSTProtocol.confirmIntent(protocolStorage, redemptionIntentHash, _hashLock, storageRoot, _blockHeight, path, _rlpParentNodes);

        emit RedemptionIntentConfirmed(uuid, redemptionIntentHash, _redeemer, _beneficiary, _amount, expirationHeight_);
    }

    function makeRedemptionIntentHash(uint256 _amount,
        address _beneficiary,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _unlockHeight,
        bytes32 _hashLock
    )
    private
    returns (bytes32){

        bytes32 data = keccak256(abi.encodePacked(_amount, _beneficiary));
        bytes32 requestHash = keccak256(abi.encodePacked(_redeemer, _redeemerNonce, data));
        return keccak256(abi.encodePacked(requestHash, _unlockHeight, _hashLock));
    }



}