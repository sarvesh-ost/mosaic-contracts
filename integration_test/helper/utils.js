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

const utils = require('../../test/test_lib/utils');
const web3 = require('../../test/test_lib/web3');

// This is the position of message outbox defined in GatewayBase.sol
const MESSAGE_OUTBOX_OFFSET = '7';

// This is the position of message inbox defined in GatewayBase.sol
const MESSAGE_INBOX_OFFSET = '8';

/**
 * Get proof data
 *
 * @param index Storage index.
 * @param address Address of ethereum account for which proof needs to be
 *                generated.
 * @param keys Array of keys for a mapping in solidity.
 * @param blockNumber Block number.
 *
 * @return {Object} Proof data.
 */
async function _getProof(index, address, keys, blockNumber){

  if (!blockNumber) {
    let block = await web3.eth.getBlock('latest');
    blockNumber = await web3.utils.toHex(block.number);
  }

  let storageKey = utils.storagePath(
    index,
    keys
  ).toString('hex');

  let proof = await utils.getProof(
    address,
    [storageKey],
    blockNumber
  );

  let proofData = proof.result;
  proofData.block_number = blockNumber;
  return proofData;
}

class Utils {

  constructor(){}

  /**
   * Get proof for inbox
   *
   * @param address Address of ethereum account for which proof needs to be
   *                generated.
   * @param keys Array of keys for a mapping in solidity.
   * @param blockNumber Block number.
   *
   * @return {Object} Proof data.
   */
  async getInboxProof(address, keys = [], blockNumber){
    let proof = await _getProof(MESSAGE_INBOX_OFFSET, address, keys, blockNumber);
    return proof;
  }

  /**
   * Get proof for outbox
   *
   * @param address Address of ethereum account for which proof needs to be
   *                generated.
   * @param keys Array of keys for a mapping in solidity.
   * @param blockNumber Block number.
   *
   * @return {Object} Proof data.
   */
  async getOutboxProof(address, keys = [], blockNumber){
    let proof = await _getProof(MESSAGE_OUTBOX_OFFSET, address, keys, blockNumber);
    return proof;
  }

}

module.exports = new Utils();
