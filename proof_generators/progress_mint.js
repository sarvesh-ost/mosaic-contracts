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
const INBOX_MESSAGE_BOX_OFFSET = '8';

class ProgressMint {

  /**
   * @param {Object} contractRegistry All the deployed contracts
   */
  constructor(contractRegistry) {
    this.contractRegistry = contractRegistry;
  }

  /**
   * Generates the proof data for progress mint.
   *
   * @param {object} params.
   * @param {string} options.messageHash Message hash for progress mint.
   * @param {string} options.unlockSecret Unlock secret for progress mint.
   * @param {string} options.facilitator Facilitator address for progress mint.
   *
   * @returns {JSON} The Json object containing the proof data.
   */
  async generateProof(params) {

    let messageHash = params.messageHash;
    let unlockSecret = params.unlockSecret;
    let facilitator = params.facilitator;

    let coGateway = this.contractRegistry.coGateway;

    let result = await coGateway.progressMint.call(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    let tx = await coGateway.progressMint(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    let events = EventsDecoder.getEvents(tx, coGateway);

    let block = await web3.eth.getBlock('latest');

    let storageKey = utils.storagePath(
      INBOX_MESSAGE_BOX_OFFSET,
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

    // Add return params in proof json data.
    let returnParams = {};
    returnParams.beneficiary = result.beneficiary_;
    returnParams.stake_amount = result.stakeAmount_.toString(10);
    returnParams.minted_amount = result.mintedAmount_.toString(10);
    returnParams.reward_amount = result.rewardAmount_.toString(10);
    proofData.return_params = returnParams;

    // Add events in proof json data.
    proofData.event_data = events;

    // Add stake params in proof json data.
    let progress_mint_params = {};
    progress_mint_params.messageHash = messageHash;
    progress_mint_params.unlock_secret = unlockSecret;
    progress_mint_params.facilitator = facilitator;

    proofData.progress_mint_params = progress_mint_params;

    return proofData;

  }

}

module.exports = ProgressMint;
