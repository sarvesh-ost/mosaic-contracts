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

class ProgressRevertStake {

  /**
   * @param {Object} contractRegistry All the deployed contracts
   */
  constructor(contractRegistry) {
    this.contractRegistry = contractRegistry;
  }

  /**
   * Generates the proof data for progress revert stake.
   *
   * @param {object} params.
   * @param {string} options.messageHash Message hash for confirm revert
   *                                     stake intent.
   * @param {string} options.blockHeight Block height for which the proof
   *                                     will be verified.
   * @param {string} options.rlpParentNodes RLP encoded proof data.
   * @param {string} options.facilitator Facilitator address for progress mint.
   *
   * @returns {JSON} The Json object containing the proof data.
   */
  async generateProof(params) {

    let messageHash = params.messageHash;
    let blockHeight = params.blockHeight;
    let rlpParentNodes = params.rlpParentNodes;
    let facilitator = params.facilitator;

    let gateway = this.contractRegistry.gateway;

    let result = await gateway.progressRevertStake.call(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    let tx = await gateway.progressRevertStake(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
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

    // Add return params in proof json data.
    let returnParams = {};
    returnParams.staker = result.staker_;
    returnParams.staker_nonce = result.stakerNonce_.toString(10);
    returnParams.amount = result.amount_.toString(10);
    proofData.return_params = returnParams;

    // Add events in proof json data.
    proofData.event_data = events;

    // Add stake params in proof json data.
    let progress_revert_stake_params = {};
    progress_revert_stake_params.messageHash = messageHash;
    progress_revert_stake_params.blockHeight = blockHeight.toString(10);
    progress_revert_stake_params.rlpParentNodes = rlpParentNodes;
    progress_revert_stake_params.facilitator = facilitator;

    proofData.progress_revert_stake_params = progress_revert_stake_params;

    return proofData;

  }

  /**
   * Set storage hash for the given block height.
   *
   * @param {BN} blockHeight Block number for which the storage hash will
   *                         be committed.
   * @param {string} storageRoot Storage root hash for storage proof.
   */
  async setStorageProof(blockHeight, storageRoot) {
    let gateway = this.contractRegistry.gateway;
    await gateway.setStorageRoot(blockHeight, storageRoot,);
  }

}

module.exports = ProgressRevertStake;
