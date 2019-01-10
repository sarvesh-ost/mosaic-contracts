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
const MESSAGE_BOX_OFFSET = '7';

class ConfirmStakeIntent {

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
   * @param {string} options.staker Staker address.
   * @param {string} options.stakerNonce Staker nonce.
   * @param {string} options.beneficiary Beneficiary address.
   * @param {string} options.amount Stake amount.
   * @param {string} options.gasPrice Gas price.
   * @param {string} options.gasLimit Gas limit.
   * @param {string} options.hashLock Hash lock
   * @param {string} options.blockHeight Block height.
   * @param {string} options.rlpParentNodes RLP encoded proof data.
   * @param {string} options.unlockSecret Unlock secret.
   * @param {string} options.facilitator Facilitator address.
   *
   * @returns {JSON} The Json object containing the proof data.
   */
  async generateProof(params) {

    console.log("params: ", params);

    let coGateway = this.contractRegistry.coGateway;

    let staker = params.staker;
    let stakerNonce = params.stakerNonce;
    let beneficiary = params.beneficiary;
    let amount = params.amount;
    let gasPrice = params.gasPrice;
    let gasLimit = params.gasLimit;
    let hashLock = params.hashLock;
    let blockHeight = params.blockHeight;
    let rlpParentNodes = params.rlpParentNodes;
    let unlockSecret = params.unlockSecret;
    let facilitator = params.facilitator;

    let messageHash = await coGateway.confirmStakeIntent.call(
      staker,
      stakerNonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    console.log("messageHash: ", messageHash);

    let tx = await coGateway.confirmStakeIntent(
      staker,
      stakerNonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    console.log("tx: ", tx);

    let events = EventsDecoder.getEvents(tx, coGateway);

    console.log("events: ", events);

    let block = await web3.eth.getBlock('latest');

    let storageKey = utils.storagePath(
      MESSAGE_BOX_OFFSET,
      [messageHash]
    ).toString('hex');

    let proof = await utils.getProof(
      coGateway.address,
      [storageKey],
      web3.utils.toHex(block.number)
    );

    // Generate proof json data.
    let proofData = {};
    proofData.proof_data = proof.result;
    proofData.proof_data.state_root = block.stateRoot;
    proofData.proof_data.block_number = block.number;

    // Add confirm stake params in proof json data.
    let confirm_stake_params = {};
    confirm_stake_params.staker = staker;
    confirm_stake_params.stakerNonce = stakerNonce.toString(10);
    confirm_stake_params.beneficiary = beneficiary;
    confirm_stake_params.amount = amount.toString(10);
    confirm_stake_params.gasPrice = gasPrice.toString(10);
    confirm_stake_params.gasLimit = gasLimit.toString(10);
    confirm_stake_params.hashLock = hashLock;
    confirm_stake_params.blockHeight = blockHeight.toString(10);
    confirm_stake_params.rlpParentNodes = rlpParentNodes;
    confirm_stake_params.unlockSecret = unlockSecret;
    confirm_stake_params.facilitator = facilitator;

    proofData.confirm_stake_params = confirm_stake_params;

    let returnParams = {};
    returnParams.messageHash = messageHash;

    proofData.return_params = returnParams;
    proofData.event_data = events;

    // Add constructor params in proof json data.
    let valueToken = await coGateway.valueToken.call();
    let utilityToken = await coGateway.utilityToken.call();
    let stateRootProvider = await coGateway.stateRootProvider.call();
    let bounty = await coGateway.bounty.call();
    let organization = await coGateway.organization.call();
    let gateway =  await coGateway.remoteGateway.call();
    let burner = await coGateway.burner.call();

    let constructor_params = {};
    constructor_params.valueToken = valueToken;
    constructor_params.utilityToken = utilityToken;
    constructor_params.stateRootProvider = stateRootProvider;
    constructor_params.bounty = bounty.toString(10);
    constructor_params.organisation = organization;
    constructor_params.gateway = gateway;
    constructor_params.burner = burner;

    proofData.constructor_params = constructor_params;

    return proofData;

  }

  /**
   * Set storage hash for the given block height.
   *
   * @param {BN} blockHeight Block number for which the storage hash will
   *                         be commited.
   * @param {string} storageRoot Storage root hash for storage proof.
   */
  async setStorageProof(blockHeight, storageRoot) {
    let coGateway = this.contractRegistry.coGateway;
    await coGateway.setStorageRoot(blockHeight, storageRoot,);
  }

}

module.exports = ConfirmStakeIntent;
