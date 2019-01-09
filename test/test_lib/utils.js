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
// Test: lib/utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('./web3.js');
const hashLock = require("./hash_lock");
const Assert = require('assert');
const BN = require('bn.js');
const rlp = require('rlp');

const ResultType = {
  FAIL: 0,
  SUCCESS: 1
};
Object.freeze(ResultType);


/**
 * Asserts that an error message contains a string given as message. Always
 * passes if the message is `undefined`.
 *
 * @param {string} message A regular expression that the error should contain.
 * @param {Object} error The error.
 */
function assertExpectedMessage(message, error) {
  if (message !== undefined) {
    assert(
      error.message.search(message) > -1,
      'The contract was expected to error including "' + message + '", but instead: "' + error.message + '"'
    );
  }
};

/**
 *
 * @param proof Array of nodes representing merkel proof.
 * @return {string | *} Serialized proof.
 * @private
 */
function _serializeProof(proof){

  let serializedProof = [];
  proof.forEach(p => serializedProof.push(rlp.decode(p)));
  return rlp.encode(serializedProof).toString('hex');
}

/** Tracking Gas Usage. */
const receipts = [];

function Utils() {

}

Utils.prototype = {

  /** Log receipt. */
  logReceipt: (receipt, description) => {
    receipts.push({
      receipt: receipt,
      description: description,
      response: null
    })
  },

  /** Print gas statistics. */
  printGasStatistics: () => {
    var totalGasUsed = 0

    console.log("      -----------------------------------------------------");
    console.log("      Report gas usage\n");

    for (i = 0; i < receipts.length; i++) {
      const entry = receipts[i]

      totalGasUsed += entry.receipt.gasUsed

      console.log("      " + entry.description.padEnd(45) + entry.receipt.gasUsed)
    }

    console.log("      -----------------------------------------------------")
    console.log("      " + "Total gas logged: ".padEnd(45) + totalGasUsed + "\n")
  },

  /** Clear receipt. */
  clearReceipts: () => {
    receipts.splice(0, receipts.length);
  },

  /**
   * Asserts no events in the receipt.
   * @param result Receipt
   */
  expectNoEvents: (result) => {
    Assert.equal(result.receipt.logs.length, 0, "expected empty array of logs")
  },

  /**
   * Expect failure from invalid opcode or out of gas, but returns error
   * instead.
   * @param promise Contract method call.
   * @param expectedMessage Message needs to be asserted.
   */
  expectThrow: async (promise, expectedMessage) => {
    try {
      await promise;
    } catch (error) {
      if (expectedMessage !== undefined) {
        assertExpectedMessage(expectedMessage, error);
      } else {
        const invalidOpcode = error.message.search('invalid opcode') > -1;
        const outOfGas = error.message.search('out of gas') > -1;
        // Latest TestRPC has trouble with require
        const revertInstead = error.message.search('revert') > -1;
        const invalidAddress = error.message.search('invalid address') > -1;

        assert(invalidOpcode || outOfGas || revertInstead || invalidAddress, `Expected throw, but got ${error} instead`);
      }

      return;
    }
    assert(false, "Did not throw as expected");
  },

  /**
   * Asserts that a given ethereum call/transaction leads to a revert. The
   * call/transaction is given as a promise.
   *
   * @param {promise} promise Awaiting this promise must lead to a revert.
   * @param {string} expectedMessage If given, the returned error message must
   *                                 include this string (optional).
   */
  expectRevert: async (promise, expectedMessage) => {
    try {
      await promise;
    } catch (error) {
      assert(
        error.message.search('revert') > -1,
        'The contract should revert. Instead: ' + error.message
      );

      assertExpectedMessage(expectedMessage, error);
      return;
    }

    assert(false, "Did not revert as expected.");
  },

  /**
   * Asserts that a given ethereum call/transaction leads to a assert failure.
   * The call/transaction is given as a promise.
   *
   * @param {promise} promise Awaiting this promise must lead to a error.
   * @param {string} expectedMessage If given, the returned error message must
   *                                 include this string (optional).
   */
  expectFailedAssert: async (promise, expectedMessage) => {
    try {
      await promise;
    } catch (error) {
      assert(
        error.message.search('Returned error:') > -1,
        'The contract should fail an assert. Instead: ' + error.message
      );

      assertExpectedMessage(expectedMessage, error);
      return;
    }

    assert(false, "Did not fail assert as expected.");
  },

  /** Get account balance. */
  getBalance: (address) => {
    return new Promise((resolve, reject) => {
      web3.eth.getBalance(address, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(new BN(result));
        }
      })
    })
  },

  /** Get gas price. */
  getGasPrice: () => {
    return new Promise((resolve, reject) => {
      web3.eth.getGasPrice((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
    })
  },

  validateEvents: (eventLogs, expectedData) => {
    assert.equal(
      eventLogs.length,
      Object.keys(expectedData).length,
      "Number of events emitted must match expected event counts"
    );
    eventLogs.forEach((event) => {
      let eventName = event.event;
      let eventData = Object.keys(event.args);
      let eventExpectedData = expectedData[eventName];

      assert.notEqual(eventExpectedData, undefined, "Expected event not found");

      for (let index in eventData) {

        let key = eventData[index];
        if (eventExpectedData[key]) {
          if (web3.utils.isBN(eventExpectedData[key])) {
            assert(
              event.args[key].eq(eventExpectedData[key]),
              `Event data ${key} must match the expectedData`
            );
          } else {
            assert.strictEqual(
              event.args[key],
              (eventExpectedData[key]),
              `Event data ${key} must match the expectedData`
            );
          }
        }
      }
    });
  },

  advanceBlock: async () => {
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: new Date().getTime(),
    }, (err) => {
      assert.strictEqual(err, null);
    });
  },

  /** Get latest hash. */
  generateHashLock: () => {
    return hashLock.getHashLock();
  },

  getTypeHash: (structDescriptor) => {
    return web3.utils.sha3(
      web3.eth.abi.encodeParameter(
        'string',
        structDescriptor,
      ),
    );
  },

  /**
   * @param address Address of ethereum account for which proof needs to be
   *                generated.
   * @param storageKeys Array of keys for a mapping in solidity.
   * @param blockNumber Block number.
   * @return {Promise<Proof>}
   */
  getProof: async (address, storageKeys = [], blockNumber = 'latest') => {
    let params = [address, storageKeys, blockNumber];

    return new Promise(function (resolve, reject) {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'eth_getProof',
        params: params,
        id: new Date().getTime(),
      }, (err, response) => {
        if (response) {
          let accountProof = response.result.accountProof;
          let storageProofs = response.result.storageProof;
          response.result.serializedAccountProof = _serializeProof(accountProof);
          storageProofs.forEach(sp => {
            sp.serializedProof = _serializeProof(sp.proof);
          });
          resolve(response);
        }
        reject(err);
      });
    });
  },

  storagePath: function(storageIndex, mappings) {

    let path = Buffer.from(web3.utils.padLeft(storageIndex, 64), 'hex');

    if (mappings && mappings.length > 0) {
      mappings.map(mapping => {
        path = Buffer.concat([Buffer.from(web3.utils.padLeft(mapping, 64), 'hex'), path])
      });
      path = Buffer.from(web3.utils.sha3(path).slice(2), 'hex')
    }

    path = Buffer.from(web3.utils.sha3(path).slice(2), 'hex');

    return path;
  },

  ResultType: ResultType,

  ZERO_BYTES32: "0x0000000000000000000000000000000000000000000000000000000000000000",
  NULL_ADDRESS: "0x0000000000000000000000000000000000000000",
};

module.exports = new Utils();
