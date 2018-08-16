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
import "./MessageBus.sol";

contract Gateway {

	event StakeRequested(
		bytes32 requestHash,
		uint256 amount,
		address beneficiary,
		uint256 fee
	);

	bytes32 uuid;
	//Escrow address
	address stakerAddress;
	uint256 public bounty;
	WorkersInterface public workers;


	struct StakeRequest {
		uint256 amount;
		address beneficiary;
		address staker;
		uint256 fee;
		uint256 nonce;
		uint8 v;
		bytes32 r;
		bytes32 s;
	}

	mapping(bytes32 /* requesthash */ => StakeRequest) requests;
	mapping(address /*staker*/ => uint256) nonces;
	mapping(bytes32 /*intentHash*/ => MessageBus.Message) messages;
	mapping(bytes32 /*messageDigest*/ => bytes32 /*intent*/) intents;

	address brandedToken;
	MessageBus messageBus;
	MessageBus.MessageBox msgBox;

	constructor (
		WorkersInterface _workers,
		uint256 _bounty,
		bytes32 _uuid,
		address _brandedToken,
		MessageBus _messageBus
	){
		workers = _workers;
		bounty = _bounty;
		uuid = _uuid;
		//todo deploy simple stake  contract
		brandedToken = _brandedToken;
		messageBus = _messageBus;
	}

	function requestStake(
		uint256 _amount,
		address _beneficiary,
		uint256 _fee,
		uint8 _v,
		bytes32 _r,
		bytes32 _s
	)
	returns (bytes32 requestHash_)
	{
		require(_amount != 0);
		require(_beneficiary != address(0));
		require(_fee > 0);
		require(_v != 0);
		//todo check possible value of v is, Possibly it's 27 and 28
		require(_r != bytes32(0));
		require(_s != bytes32(0));

		require(EIP20Interface(brandedToken).transferFrom(msg.sender, this, _amount));

		uint256 nonce = nonces[msg.sender];
		nonces[msg.sender] = nonce ++;

		requestHash_ = keccak256(msg.sender, nonce);

		requests[requestHash_] = StakeRequest({
			amount : _amount,
			beneficiary : _beneficiary,
			staker : msg.sender,
			fee : _fee,
			nonce : nonce,
			v : _v,
			r : _r,
			s : _s
			});

		emit StakeRequested(
			requestHash_,
			_amount,
			_beneficiary,
			_fee
		);
	}

	function acceptStake(
		bytes32 requestHash,
		bytes32 hashLock
	)
	returns (bytes32 messageHash_)

	{
		require(workers.isWorker(msg.sender));
		require(requestHash != bytes32(0));
		require(hashLock != bytes32(0));
		require(requests[requestHash].amount != 0);

		require(EIP20Interface(brandedToken).transferFrom(msg.sender, this, bounty));
		StakeRequest request = requests[requestHash];
		bytes32 intentHash = keccak256(
								abi.encode(
		                        	requestHash,
									hashLock
								)
							 );
		messages[intentHash] = MessageBus.Message({
			requestHash : requestHash,
			intentHash : intentHash,
			nonce : request.nonce,
			//gasPrice:,
			r : request.r,
			s : request.s,
			v : request.v,
			sender : request.staker,
			hashLock : hashLock
			});
		messageHash_ = MessageBus(messageBus).declareMessage(msgBox, requestHash, messages[requestHash]);
		require(intents[messageHash_] == bytes32(0));
		intents[messageHash_] = intentHash;
	}

	function processStaking(
		bytes32 _intentHash,
		bytes32 _unlockSecret
	)
	external
	returns (uint256 stakeRequestAmount)
	{
		require(_messageDigest != bytes32(0));
		require(_unlockSecret != bytes32(0));

		MessageBus.Message storage message = messages[_intentHash];
		stakeRequestAmount = requests[messages.requestHash].amount;

		require(stakeRequestAmount != 0);
		require(MessageBus(messageBus).progress(msgBox, requestHash, messages[requestHash]));

		require(EIP20Interface(brandedToken).transfer(stakerAddress, stakeRequestAmount));

		delete requests[messages.requestHash];
		delete messages[_intentHash];
		return bytes32(0);
	}

}
