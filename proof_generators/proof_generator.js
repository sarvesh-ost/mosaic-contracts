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

const BN = require("bn.js");
const fs = require('fs');
const path = require('path');

const utils = require("../test/test_lib/utils.js");
const CoGateway = require('../integration_test/helper/co_gateway');
const Gateway = require('../integration_test/helper/gateway');
const proofUtils = require('../integration_test/helper/utils');

let deployer = require('./deployer.js');

const PROOF_GENERATED_PATH = 'test/data/';

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

/**
 * Get address of all deployed contracts.
 *
 * @param {Object} contractRegistry Object containing all contracts.
 *
 * @returns {Object} An object containing the deployed contract address.
 */
function getContractAddresses(contractRegistry) {

  let addresses = {};

  Object.keys(contractRegistry).map(function(key, index) {
    if (contractRegistry[key].address) {
      addresses[key] = contractRegistry[key].address;
    }
  });

  return addresses;

}

contract('Stake and Mint ', function (accounts) {

  let contractRegistry, stakeParams, generatedHashLock;

  beforeEach(async function () {

    contractRegistry = await deployer(accounts);

    stakeParams = {
      amount: new BN(100000000),
      beneficiary: accounts[3],
      gasPrice: new BN(1),
      gasLimit: new BN(10000),
      nonce: new BN(0),
      staker: accounts[0],
    };

  });

  it('Generate proof data for "Stake progressed"', async function () {

    let gateway = new Gateway(contractRegistry);
    let coGateway = new CoGateway(contractRegistry);

    let numberOfProofs = 2;

    for (let i = 0; i<numberOfProofs; i++) {

      let proofData = {};
      proofData.contracts = getContractAddresses(contractRegistry);

      proofData.gateway = {};
      proofData.gateway.constructor = await gateway.getConstructorParams();

      proofData.co_gateway = {};
      proofData.co_gateway.constructor = await coGateway.getConstructorParams();

      generatedHashLock = utils.generateHashLock();

      // Stake
      stakeParams.nonce = stakeParams.nonce.addn(1);
      stakeParams.hashLock = generatedHashLock.l;
      stakeParams.unlockSecret = generatedHashLock.s;

      let stakeResult = await gateway.stake(stakeParams);

      let stakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [stakeResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.stake = {};
      proofData.gateway.stake.params = stakeParams;
      proofData.gateway.stake.return_value = stakeResult;
      proofData.gateway.stake.proof_data = stakeProofData;

      // Confirm stake intent.
      let confirmStakeIntentParams = Object.assign({}, stakeParams);
      confirmStakeIntentParams.blockHeight = stakeProofData.block_number;
      confirmStakeIntentParams.rlpParentNodes = stakeProofData.storageProof[0].serializedProof;
      confirmStakeIntentParams.facilitator = stakeParams.staker;
      confirmStakeIntentParams.storageRoot = stakeProofData.storageHash;

      let confirmStakeIntentResult = await coGateway.confirmStakeIntent(confirmStakeIntentParams);

      let confirmStakeIntentProofData = await proofUtils.getInboxProof(
        coGateway.address,
        [confirmStakeIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.confirm_stake_intent = {};
      proofData.co_gateway.confirm_stake_intent.params = confirmStakeIntentParams;
      proofData.co_gateway.confirm_stake_intent.return_value = confirmStakeIntentResult;
      proofData.co_gateway.confirm_stake_intent.proof_data = confirmStakeIntentProofData;

      // Progress stake
      let progressStakeParams = {};
      progressStakeParams.messageHash = stakeResult.returned_value.messageHash_;
      progressStakeParams.unlockSecret = stakeParams.unlockSecret;
      progressStakeParams.facilitator = stakeParams.staker;

      let progressStakeResult = await gateway.progressStake(progressStakeParams);

      let progressStakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [confirmStakeIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.progress_stake = {};
      proofData.gateway.progress_stake.params = progressStakeParams;
      proofData.gateway.progress_stake.return_value = progressStakeResult;
      proofData.gateway.progress_stake.proof_data = progressStakeProofData;

      // Progress mint.
      let progressMintParams = Object.assign({}, progressStakeParams);

      let progressMintResult = await coGateway.progressMint(progressMintParams);

      let progressMintProofData = await proofUtils.getInboxProof(
        coGateway.address,
        [confirmStakeIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.progress_mint = {};
      proofData.co_gateway.progress_mint.params = progressMintParams;
      proofData.co_gateway.progress_mint.return_value = progressMintResult;
      proofData.co_gateway.progress_mint.proof_data = progressMintProofData;

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}stake_progressed_${stakeParams.nonce.toString(10)}.json`,
        JSON.stringify(proofData)
      );
    }

  });

/*  it('Generate proof data for "Stake revoked"', async function () {

    let gateway = new Gateway(contractRegistry);
    let coGateway = new CoGateway(contractRegistry);

    let numberOfProofs = 2;

    for (let i = 0; i<numberOfProofs; i++) {

      let proofData = {};
      proofData.contracts = getContractAddresses(contractRegistry);

      proofData.gateway = {};
      proofData.gateway.constructor = await gateway.getConstructorParams();

      proofData.co_gateway = {};
      proofData.co_gateway.constructor = await coGateway.getConstructorParams();

      generatedHashLock = utils.generateHashLock();

      // Stake
      stakeParams.nonce = stakeParams.nonce.addn(1);
      stakeParams.hashLock = generatedHashLock.l;
      stakeParams.unlockSecret = generatedHashLock.s;

      let stakeResult = await gateway.stake(stakeParams);

      let stakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [stakeResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.stake = {};
      proofData.gateway.stake.params = stakeParams;
      proofData.gateway.stake.return_value = stakeResult;
      proofData.gateway.stake.proof_data = stakeProofData;

      // Confirm stake intent.
      let confirmStakeIntentParams = Object.assign({}, stakeParams);
      confirmStakeIntentParams.blockHeight = stakeProofData.block_number;
      confirmStakeIntentParams.rlpParentNodes = stakeProofData.storageProof[0].serializedProof;
      confirmStakeIntentParams.facilitator = stakeParams.staker;
      confirmStakeIntentParams.storageRoot = stakeProofData.storageHash;

      let confirmStakeIntentResult = await coGateway.confirmStakeIntent(confirmStakeIntentParams);

      let confirmStakeIntentProofData = await proofUtils.getInboxProof(
        coGateway.address,
        [confirmStakeIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.confirm_stake_intent = {};
      proofData.co_gateway.confirm_stake_intent.params = confirmStakeIntentParams;
      proofData.co_gateway.confirm_stake_intent.return_value = confirmStakeIntentResult;
      proofData.co_gateway.confirm_stake_intent.proof_data = confirmStakeIntentProofData;

      // Revert stake
      let revertStakeParams = {};
      revertStakeParams.messageHash = confirmStakeIntentResult.returned_value.messageHash_;
      revertStakeParams.staker = stakeParams.staker;

      let revertStakeResult = await gateway.revertStake(revertStakeParams);

      let revertStakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [stakeResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.revert_stake = {};
      proofData.gateway.revert_stake.params = revertStakeParams;
      proofData.gateway.revert_stake.return_value = revertStakeResult;
      proofData.gateway.revert_stake.proof_data = revertStakeProofData;

      // Confirm revert stake
      let confirmRevertStakeParams = {};
      confirmRevertStakeParams.messageHash = revertStakeParams.messageHash;
      confirmRevertStakeParams.blockHeight = revertStakeProofData.block_number;
      confirmRevertStakeParams.rlpParentNodes = revertStakeProofData.storageProof[0].serializedProof;
      confirmRevertStakeParams.facilitator = stakeParams.staker;
      confirmRevertStakeParams.storageRoot = revertStakeProofData.storageHash;

      let confirmRevertStakeResult = await coGateway.confirmRevertStakeIntent(confirmRevertStakeParams);

      let confirmRevertStakeProofData = await proofUtils.getInboxProof(
        coGateway.address,
        [confirmRevertStakeParams.messageHash],
      );

      // Populate proof data.
      proofData.co_gateway.confirm_revert_stake_intent = {};
      proofData.co_gateway.confirm_revert_stake_intent.params = confirmRevertStakeParams;
      proofData.co_gateway.confirm_revert_stake_intent.return_value = confirmRevertStakeResult;
      proofData.co_gateway.confirm_revert_stake_intent.proof_data = confirmRevertStakeProofData;

      // Progress revoke.
      let progressRevertStakeParams = {};
      progressRevertStakeParams.messageHash = revertStakeParams.messageHash;
      progressRevertStakeParams.blockHeight = confirmRevertStakeProofData.block_number;
      progressRevertStakeParams.rlpParentNodes = confirmRevertStakeProofData.storageProof[0].serializedProof;
      progressRevertStakeParams.facilitator = stakeParams.staker;
      progressRevertStakeParams.storageRoot = confirmRevertStakeProofData.storageHash;

      let progressRevertStakeResult = await gateway.progressRevertStake(progressRevertStakeParams);

      let progressRevertStakeProofData = await proofUtils.getOutboxProof(
        gateway.address,
        [progressRevertStakeParams.messageHash],
      );

      // Populate proof data.
      proofData.gateway.progress_revert_stake_intent = {};
      proofData.gateway.progress_revert_stake_intent.params = progressRevertStakeParams;
      proofData.gateway.progress_revert_stake_intent.return_value = progressRevertStakeResult;
      proofData.gateway.progress_revert_stake_intent.proof_data = progressRevertStakeProofData;

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}stake_revoked_${stakeParams.nonce.toString(10)}.json`,
        JSON.stringify(proofData)
      );
    }

  });*/

});

/*contract('Redeem and Un-stake ', function (accounts) {

  let contractRegistry, redeemParams, generatedHashLock;

  beforeEach(async function () {

    contractRegistry = await deployer(accounts);

    redeemParams = {
      amount: new BN(1000),
      gasPrice: new BN(1),
      gasLimit: new BN(100),
      nonce: new BN(0),
      redeemer: accounts[0],
      beneficiary: accounts[3],
    };

  });

  it('Generate proof data for "Redeem progressed"', async function () {

    let gateway = new Gateway(contractRegistry);
    let coGateway = new CoGateway(contractRegistry);

    let numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; i++) {

      let proofData = {};
      proofData.contracts = getContractAddresses(contractRegistry);

      proofData.gateway = {};
      proofData.gateway.constructor = await gateway.getConstructorParams();

      proofData.co_gateway = {};
      proofData.co_gateway.constructor = await coGateway.getConstructorParams();

      // Redeem.
      generatedHashLock = utils.generateHashLock();

      redeemParams.nonce = redeemParams.nonce.addn(1);
      redeemParams.hashLock = generatedHashLock.l;
      redeemParams.unlockSecret = generatedHashLock.s;

      let redeemResult = await coGateway.redeem(redeemParams);

      let redeemProofData = await proofUtils.getOutboxProof(
        coGateway.address,
        [redeemResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.redeem = {};
      proofData.co_gateway.redeem.params = redeemParams;
      proofData.co_gateway.redeem.return_value = redeemResult;
      proofData.co_gateway.redeem.proof_data = redeemProofData;

      // Confirm redeem intent
      let confirmRedeemIntentParams = Object.assign({}, redeemParams);
      confirmRedeemIntentParams.blockNumber = redeemProofData.block_number;
      confirmRedeemIntentParams.storageProof = redeemProofData.storageProof[0].serializedProof;
      confirmRedeemIntentParams.facilitator = redeemProofData.staker;
      confirmRedeemIntentParams.storageRoot = redeemProofData.storageHash;
      confirmRedeemIntentParams.facilitator = redeemParams.redeemer;

      let confirmRedeemIntentResult = await gateway.confirmRedeemIntent(confirmRedeemIntentParams);

      let confirmRedeemIntentProofData = await proofUtils.getInboxProof(
        gateway.address,
        [confirmRedeemIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.confirm_redeem_intent = {};
      proofData.gateway.confirm_redeem_intent.params = confirmRedeemIntentParams;
      proofData.gateway.confirm_redeem_intent.return_value = confirmRedeemIntentResult;
      proofData.gateway.confirm_redeem_intent.proof_data = confirmRedeemIntentProofData;

      // Progress redeem.
      let progressRedeemParams = {};
      progressRedeemParams.messageHash = confirmRedeemIntentResult.returned_value.messageHash_;
      progressRedeemParams.unlockSecret = redeemParams.unlockSecret;
      progressRedeemParams.facilitator = redeemParams.redeemer;

      let progressRedeemResult = await coGateway.progressRedeem(progressRedeemParams);

      let progressRedeemProofData = await proofUtils.getOutboxProof(
        coGateway.address,
        [progressRedeemParams.messageHash],
      );

      // Populate proof data.
      proofData.co_gateway.progress_redeem = {};
      proofData.co_gateway.progress_redeem.params = progressRedeemParams;
      proofData.co_gateway.progress_redeem.return_value = progressRedeemResult;
      proofData.co_gateway.progress_redeem.proof_data = progressRedeemProofData;

      // Progress unstake.
      let progressUnstakeParams = Object.assign({}, progressRedeemParams);
      progressUnstakeParams.unstakeAmount = redeemParams.amount;

      let progressUnstakeResult = await gateway.progressUnstake(progressUnstakeParams);

      let progressUnstakeProofData = await proofUtils.getInboxProof(
        gateway.address,
        [progressUnstakeParams.messageHash],
      );

      // Populate proof data.
      proofData.gateway.progress_unstake = {};
      proofData.gateway.progress_unstake.params = progressUnstakeParams;
      proofData.gateway.progress_unstake.return_value = progressUnstakeResult;
      proofData.gateway.progress_unstake.proof_data = progressUnstakeProofData;

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}redeem_progressed_${redeemParams.nonce.toString(10)}.json`,
        JSON.stringify(proofData)
      );
    }
  });

  it('Generate proof data for "Redeem revoked"', async function () {

    let gateway = new Gateway(contractRegistry);
    let coGateway = new CoGateway(contractRegistry);

    let numberOfProofs = 2;

    for (let i = 0; i < numberOfProofs; i++) {

      let proofData = {};
      proofData.contracts = getContractAddresses(contractRegistry);

      proofData.gateway = {};
      proofData.gateway.constructor = await gateway.getConstructorParams();

      proofData.co_gateway = {};
      proofData.co_gateway.constructor = await coGateway.getConstructorParams();

      // Redeem.
      generatedHashLock = utils.generateHashLock();

      redeemParams.nonce = redeemParams.nonce.addn(1);
      redeemParams.hashLock = generatedHashLock.l;
      redeemParams.unlockSecret = generatedHashLock.s;

      let redeemResult = await coGateway.redeem(redeemParams);

      let redeemProofData = await proofUtils.getOutboxProof(
        coGateway.address,
        [redeemResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.co_gateway.redeem = {};
      proofData.co_gateway.redeem.params = redeemParams;
      proofData.co_gateway.redeem.return_value = redeemResult;
      proofData.co_gateway.redeem.proof_data = redeemProofData;

      // Confirm redeem intent
      let confirmRedeemIntentParams = Object.assign({}, redeemParams);
      confirmRedeemIntentParams.blockNumber = redeemProofData.block_number;
      confirmRedeemIntentParams.storageProof = redeemProofData.storageProof[0].serializedProof;
      confirmRedeemIntentParams.facilitator = redeemProofData.staker;
      confirmRedeemIntentParams.storageRoot = redeemProofData.storageHash;
      confirmRedeemIntentParams.facilitator = redeemParams.redeemer;

      let confirmRedeemIntentResult = await gateway.confirmRedeemIntent(confirmRedeemIntentParams);

      let confirmRedeemIntentProofData = await proofUtils.getInboxProof(
        gateway.address,
        [confirmRedeemIntentResult.returned_value.messageHash_],
      );

      // Populate proof data.
      proofData.gateway.confirm_redeem_intent = {};
      proofData.gateway.confirm_redeem_intent.params = confirmRedeemIntentParams;
      proofData.gateway.confirm_redeem_intent.return_value = confirmRedeemIntentResult;
      proofData.gateway.confirm_redeem_intent.proof_data = confirmRedeemIntentProofData;

      // Revert redeem.
      let revertRedeemParams = {};
      revertRedeemParams.messageHash = redeemResult.returned_value.messageHash_;
      revertRedeemParams.redeemer = redeemParams.redeemer;

      let revertRedeemResult = await coGateway.revertRedeem(revertRedeemParams);

      let revertRedeemProofData = await proofUtils.getOutboxProof(
        coGateway.address,
        [revertRedeemParams.messageHash],
      );

      // Populate proof data.
      proofData.co_gateway.revert_redeem = {};
      proofData.co_gateway.revert_redeem.params = revertRedeemParams;
      proofData.co_gateway.revert_redeem.return_value = revertRedeemResult;
      proofData.co_gateway.revert_redeem.proof_data = revertRedeemProofData;

      // Confirm revert redeem intent.
      let confirmRevertRedeemIntentParams = {};
      confirmRevertRedeemIntentParams.messageHash = revertRedeemParams.messageHash;
      confirmRevertRedeemIntentParams.blockNumber = revertRedeemProofData.block_number;
      confirmRevertRedeemIntentParams.rlpParentNodes = revertRedeemProofData.storageProof[0].serializedProof;
      confirmRevertRedeemIntentParams.facilitator = redeemParams.redeemer;
      confirmRevertRedeemIntentParams.storageRoot = revertRedeemProofData.storageHash;

      let confirmRevertRedeemResult = await gateway.confirmRevertRedeemIntent(confirmRevertRedeemIntentParams);

      let confirmRevertRedeemProofData = await proofUtils.getInboxProof(
        gateway.address,
        [confirmRevertRedeemIntentParams.messageHash],
      );

      // Populate proof data.
      proofData.gateway.confirm_revert_redeem_intent = {};
      proofData.gateway.confirm_revert_redeem_intent.params = confirmRevertRedeemIntentParams;
      proofData.gateway.confirm_revert_redeem_intent.return_value = confirmRevertRedeemResult;
      proofData.gateway.confirm_revert_redeem_intent.proof_data = confirmRevertRedeemProofData;

      // Progress revert redeem.
      let progressRevertRedeemParams = {};
      progressRevertRedeemParams.messageHash = revertRedeemParams.messageHash;
      progressRevertRedeemParams.blockHeight = confirmRevertRedeemProofData.block_number;
      progressRevertRedeemParams.rlpParentNodes = confirmRevertRedeemProofData.storageProof[0].serializedProof;
      progressRevertRedeemParams.facilitator = redeemParams.redeemer;
      progressRevertRedeemParams.storageRoot = confirmRevertRedeemProofData.storageHash;

      let progressRevertRedeemResult = await coGateway.progressRevertRedeem(progressRevertRedeemParams);

      let progressRevertRedeemProofData = await proofUtils.getOutboxProof(
        coGateway.address,
        [progressRevertRedeemParams.messageHash],
      );

      // Populate proof data.
      proofData.co_gateway.progress_revert_redeem = {};
      proofData.co_gateway.progress_revert_redeem.params = progressRevertRedeemParams;
      proofData.co_gateway.progress_revert_redeem.return_value = progressRevertRedeemResult;
      proofData.co_gateway.progress_revert_redeem.proof_data = progressRevertRedeemProofData;

      // Write the proof data in to the files.
      writeToFile(
        `${PROOF_GENERATED_PATH}redeem_revoked_${redeemParams.nonce.toString(10)}.json`,
        JSON.stringify(proofData)
      );
    }
  });

});*/
