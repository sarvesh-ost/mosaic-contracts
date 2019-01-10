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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------
const utils = require("../test/test_lib/utils.js");
const ProofUtils = require('./utils.js');
const BN = require("bn.js");
const fs = require('fs');
const path = require('path');

let deployer = require('./deployer.js');
let Stake = require('./stake');
let redeem = require('./redeem.js');
let confirmRedeem = require('./confirm_redeem');
let progressRedeem = require('./progress_redeem');
let OUTBOX_OFFSET = "7";

const STAKE_DATA_PATH = 'test/data/stake.json';

/**
 * Write proof data in the file.
 *
 * @param {string} location Location where the file will be written.
 * @param {string} content The content that will be written in the file.
 *
 */
function writeToFile(location, content) {

  let rootDir= `${__dirname}/../`;

  const pathLocation = path.join(rootDir, location);

  fs.writeFile(pathLocation, content, function(err) {
    if(err) {
      throw err;
    }
  });

}

// contract('stake and mint ', function (accounts) {
//
//   let contractRegistry, stakeParams, generatedHashLock, proofUtils;
//
//   beforeEach(async function () {
//
//     contractRegistry = await deployer(accounts);
//
//     generatedHashLock = utils.generateHashLock();
//
//     stakeParams = {
//       amount: new BN(100000000),
//       beneficiary: accounts[3],
//       gasPrice: new BN(1),
//       gasLimit: new BN(10000),
//       nonce: new BN(1),
//       hashLock: generatedHashLock.l,
//       staker: accounts[0]
//     };
//     proofUtils = new ProofUtils(contractRegistry);
//
//   });
//
//   it('Generate proof data for "stake" ', async function () {
//
//     let stakeProofGenerator = new Stake(contractRegistry);
//     let proofData = await stakeProofGenerator.generateProof(stakeParams);
//
//     // write the proof data in to the files.
//     writeToFile(STAKE_DATA_PATH, JSON.stringify(proofData));
//
//   });
//
// });

contract('Redeem and un-stake ', function (accounts) {

  let contractRegistry, redeemRequest, proofUtils;

  beforeEach(async function () {

    contractRegistry = await deployer(accounts);

    let hashLockObj = utils.generateHashLock();

    redeemRequest = {
      amount: new BN(1000),
      gasPrice: new BN(10),
      gasLimit: new BN(10),
      nonce: new BN(1),
      hashLock: hashLockObj.l,
      unlockSecret: hashLockObj.s,
      redeemer: accounts[0],
      beneficiary: accounts[0],
    };
    proofUtils = new ProofUtils(contractRegistry);
  });

  it('redeem and un-stake', async function () {

    let response = await redeem(contractRegistry, redeemRequest);
    let path = utils.storagePath(
      OUTBOX_OFFSET,
      [response.messageHash]
    );

    let proof = await utils.getProof(
      contractRegistry.coGateway.address,
      [path]
    );

    redeemRequest.blockNumber = response.blockNumber;
    redeemRequest.messageHash = response.messageHash;
    redeemRequest.proof = proof;
    proofUtils.generateRedeemTestData(redeemRequest, '/redeem.json');
    await confirmRedeem(contractRegistry, redeemRequest);
    response = await progressRedeem(contractRegistry, redeemRequest);

    proof = await utils.getProof(
      contractRegistry.coGateway.address,
      [path]
    );
    redeemRequest.blockNumber = response.blockNumber;
    redeemRequest.proof = proof;

    proofUtils.generateRedeemTestData(redeemRequest, '/progress_redeem.json');

  });

});

