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

class RevertStake {

  /**
   * @param {Object} contractRegistry All the deployed contracts
   */
  constructor(contractRegistry) {
    this.contractRegistry = contractRegistry;
  }

  /**
   * Generates the proof data for revert stake.
   *
   * @param {object} params.
   * @param {string} options.messageHash Message hash of revert stake request.
   * @param {string} options.staker Staker address for revert stake.
   *
   * @returns {JSON} The Json object containing the proof data.
   */
  async generateProof(params) {

    let messageHash = params.messageHash;
    let staker = params.staker;

    let gateway = this.contractRegistry.gateway;

    let baseToken = this.contractRegistry.baseToken;
    let bounty = await gateway.bounty.call();
    let penalty = bounty.muln(1.5);

    await baseToken.approve(gateway.address, penalty, {from: staker });

    let result = await gateway.revertStake.call(
      messageHash,
      { from: staker },
    );

    let tx = await gateway.revertStake(
      messageHash,
      { from: staker },
    );

    let events = EventsDecoder.getEvents(tx, gateway);

    let block = await web3.eth.getBlock('latest');

    let storageKey = utils.storagePath(
      MESSAGE_BOX_OFFSET,
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
    returnParams.amount = result.amount_.toString(10);
    returnParams.staker_nonce = result.stakerNonce_.toString(10);
    proofData.return_params = returnParams;

    // Add events in proof json data.
    proofData.event_data = events;

    // Add revert stake params in proof json data.
    let revert_stake_params = {};
    revert_stake_params.messageHash = messageHash;
    revert_stake_params.staker = staker;

    proofData.revert_stake_params = revert_stake_params;

    return proofData;

  }

}

module.exports = RevertStake;
