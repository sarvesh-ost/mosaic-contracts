// Copyright 2019 OpenST Ltd.
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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../test/test_lib/web3');
const utils = require('../test/test_lib/utils');
const EventsDecoder = require('../test/test_lib/event_decoder');

// This is the position of MessageBox defined in GatewayBase.sol
const OUTBOX_MESSAGE_BOX_OFFSET = '7';

class Stake {

  /**
   * @param {Object} contractRegistry All the deployed contracts
   */
  constructor(contractRegistry) {
    this.contractRegistry = contractRegistry;
  }

  /**
   * Generates the proof data for stake request.
   *
   * @param {object} params.
   * @param {BN} options.amount Stake amount.
   * @param {string} options.beneficiary Beneficiary address.
   * @param {BN} options.gasPrice Gas price.
   * @param {BN} options.gasLimit Gas limit.
   * @param {BN} options.nonce Staker nonce.
   * @param {BN} options.hashLock Hash lock.
   * @param {BN} options.staker Staker address.
   *
   * @returns {JSON} The Json object containing the proof data.
   */
  async generateProof(params) {

    let amount = params.amount;
    let beneficiary = params.beneficiary;
    let gasPrice = params.gasPrice;
    let gasLimit = params.gasLimit;
    let nonce = params.nonce;
    let hashLock = params.hashLock;
    let staker = params.staker;
    let unlockSecret = params.unlockSecret;


    let token = this.contractRegistry.mockToken;
    let baseToken = this.contractRegistry.baseToken;
    let gateway = this.contractRegistry.gateway;
    let bounty = await gateway.bounty.call();
    let deployer = this.contractRegistry.owner;

    await token.transfer(
      staker,
      amount,
      { from: deployer }
    );

    await baseToken.transfer(
      staker,
      bounty,
      { from: deployer }
    );

    await token.approve(gateway.address, amount, { from: staker });
    await baseToken.approve(gateway.address, bounty, {from: staker });

    let messageHash = await gateway.stake.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: staker },
    );

    let tx = await gateway.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: staker },
    );

    let events = EventsDecoder.getEvents(tx, gateway);

    let block = await web3.eth.getBlock('latest');

    let storageKey = utils.storagePath(
      OUTBOX_MESSAGE_BOX_OFFSET,
      [messageHash]
    ).toString('hex');

    let proof = await utils.getProof(
      gateway.address,
      [storageKey],
      web3.utils.toHex(block.number)
    );

    // Generate proof json data.
    let proofData = {};
    proofData.proof_data = proof.result;
    proofData.proof_data.state_root = block.stateRoot;
    proofData.proof_data.block_number = block.number;

    // Add stake params in proof json data.
    let stake_params = {};
    stake_params.amount = amount.toString(10);
    stake_params.beneficiary = beneficiary;
    stake_params.gas_price = gasPrice.toString(10);
    stake_params.gas_limit = gasLimit.toString(10);
    stake_params.nonce = nonce.toString(10);
    stake_params.hash_lock = hashLock;
    stake_params.unlock_secret = unlockSecret;
    stake_params.staker = staker;

    proofData.stake_params = stake_params;

    let returnParams = {};
    returnParams.messageHash = messageHash;

    proofData.return_params = returnParams;
    proofData.event_data = events;

    // Add constructor params in proof json data.
    let constructor_params = {};
    constructor_params.token = token.address;
    constructor_params.base_token = baseToken.address;
    constructor_params.bounty = await gateway.bounty.call();
    constructor_params.state_root_provider = await gateway.stateRootProvider.call();
    constructor_params.organisation = await gateway.organization.call();
    constructor_params.burner = await gateway.burner.call();

    proofData.constructor_params = constructor_params;

    return proofData;

  }

}

module.exports = Stake;
