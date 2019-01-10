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
const Utils = require("../test/test_lib/utils.js");
const BN = require("bn.js");

let deployer = require('./deployer.js');
let redeem = require('./redeem.js');
let confirmRedeem = require('./confirm_redeem');
let OUTBOX_OFFSET = "7";
contract('stake and mint ', function (accounts) {

  let contractRegistry;

  beforeEach(async function () {
    // contractRegistry = await deployer(accounts);
  });

  it('Proof generate test case', async function () {

  });

});


contract('Redeem and un-stake ', function (accounts) {

  let contractRegistry, redeemRequest;

  beforeEach(async function () {

    contractRegistry = await deployer(accounts);

    let hashLockObj = Utils.generateHashLock();

    redeemRequest = {
      amount: new BN(1000),
      gasPrice: new BN(10),
      gasLimit: new BN(10),
      nonce: new BN(1),
      hashLock: hashLockObj.l,
      secret: hashLockObj.s,
      redeemer: accounts[0],
      beneficiary: accounts[0],
    };
  });

  it('redeem and un-stake', async function () {

    let response = await redeem(contractRegistry, redeemRequest);
    console.log("response", response);
    let path = Utils.storagePath(
      OUTBOX_OFFSET,
      [response.messageHash]
    );
    let proof = await Utils.getProof(
      contractRegistry.coGateway.address,
      [path]
    );
    console.log("redeem proof  ", JSON.stringify(proof));

    let storageRoot = proof.result.storageHash;

    redeemRequest.blockNumber = response.blockNumber;
    redeemRequest.storageRoot = storageRoot;
    redeemRequest.storageProof = proof.result.storageProof[0].serializedProof;

    console.log("Gateway ADdresss", contractRegistry.gateway.address);
    console.log("co-gateway ADdresss", contractRegistry.coGateway.address);
    await confirmRedeem(contractRegistry, redeemRequest);
  });


});
