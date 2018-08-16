pragma solidity ^0.4.0;

import "./WorkersInterface.sol";
import "./MessageBus.sol";
import "./ProofLib";
import "./UtilityTokenInterface.sol";

contract CoGateway {

	WorkersInterface public workers;
	MessageBus.MessageBox messageBox;
	mapping(bytes32 /*intentHash*/ => MessageBus.Message) messages;
	uint256 outboxOffset = 4;

	mapping(bytes32 /*requestHash*/ => Mint) mints;
	address utilityToken;

	struct Mint {
		uint256 amount;
		address beneficiary;
		uint256 fee;
	}

	bytes32 constant MINTREQUEST_TYPEHASH = keccak256(
		abi.encode("Mint(uint256 amount,address beneficiary,uint256 fee)"));

	function confirmStakingIntent(
		address _staker,
		uint256 _stakerNonce,
		address _beneficiary,
		uint256 _amount,
		uint256 _fee,
		bytes32 _hashLock,
		bytes _rlpParentNodes,
		bytes32 _r,
		bytes32 _s,
		uint8 _v
	)
	external
	{
		//bytes32 data = keccak256(abi.encodePacked(_amount, _beneficiary));

		bytes32 requestHash = keccak256(abi.encodePacked(_staker, _stakerNonce));

		mints[requestHash] = Mint({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee
			});

		bytes32 stakingIntentHash = keccak256(abi.encodePacked(requestHash, _hashLock));

		bytes memory path = ProofLib.bytes32ToBytes(
			ProofLib.storageVariablePath(intentsMappingStorageIndexPosition,
			keccak256(abi.encodePacked(_staker, _stakerNonce)))
		);

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);

		require(storageRoot != bytes32(0));
		messages[stakingIntentHash] = MessageBus.Message({
			requestHash : requestHash,
			intentHash : stakingIntentHash,
			nonce : _stakerNonce,
			//gasPrice:,
			r : _r,
			s : _s,
			v : _v,
			sender : _staker,
			hashLock : _hashLock
			});
		MessageBus.confirmMessage(
			messageBox,
			MINTREQUEST_TYPEHASH,
			requestHash,
			messages[stakingIntentHash],
			_rlpParentNodes,
			outboxOffset,
			storageRoot);
	}

	function processMinting(
		bytes32 _stakingIntentHash,
		bytes32 _unlockSecret)
	external
	returns (address amount)
	{
		require(_stakingIntentHash != bytes32(0));

		MessageBus.Message message = messages[_stakingIntentHash];
		bytes32 messageHash = messages.requestHash;

		require(messages.requestHash != bytes32(0));

		Mint storage mintRequest = mints[_stakingIntentHash];

		amount = mintRequest.amount;

		require(UtilityTokenInterface(token).mint(mint.beneficiary, mint.amount));

		require(MessageBus(messageBus).progressInbox(msgBox, requestHash, messages[requestHash]));

		delete mints[messageHash];
		delete messages[_stakingIntentHash];
	}

}
