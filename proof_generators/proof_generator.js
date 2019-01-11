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
let ProgressStake = require('./progress_stake');
let RevertStake = require('./revert_stake');
let ConfirmStakeIntent = require('./confirm_stake_intent');
let ProgressMint = require('./progress_mint');
let ConfirmRevertStakeIntent = require('./confirm_revert_stake_intent');
let ProgressRevertStake = require('./progress_revert_stake');
let redeem = require('./redeem.js');
let confirmRedeem = require('./confirm_redeem');
let progressRedeem = require('./progress_redeem');
let progressUnstake = require('./progress_unstake');
let revertRedeem = require('./revert_redeem');

let OUTBOX_MESSAGE_BOX_OFFSET = "7";
let INBOX_MESSAGE_BOX_OFFSET = "8";

const STAKE_DATA_PATH = 'test/data/stake.json';
const PROGRESS_STAKE_DATA_PATH = 'test/data/progress_stake.json';
const REVERT_STAKE_DATA_PATH = 'test/data/revert_stake.json';
const CONFIRM_STAKE_INTENT_DATA_PATH = 'test/data/confirm_stake_intent.json';
const PROGRESS_MINT_DATA_PATH = 'test/data/progress_mint.json';
const CONFIRM_REVERT_STAKE_INTENT_DATA_PATH = 'test/data/confirm_revert_stake_intent.json';
const PROGRESS_REVERT_STAKE_DATA_PATH = 'test/data/progress_revert_stake.json';

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
 * @returns {JSON} A json object containing the contract address.
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

  let contractRegistry, stakeParams, generatedHashLock, proofUtils;

  beforeEach(async function () {

    contractRegistry = await deployer(accounts);

    generatedHashLock = utils.generateHashLock();

    stakeParams = {
      amount: new BN(100000000),
      beneficiary: accounts[3],
      gasPrice: new BN(1),
      gasLimit: new BN(10000),
      nonce: new BN(1),
      hashLock: generatedHashLock.l,
      unlockSecret: generatedHashLock.s,
      staker: accounts[0]
    };

  });

  it('Generate proof data for "stake"', async function () {

    let contractAddresses = getContractAddresses(contractRegistry);
    let stakeProofGenerator = new Stake(contractRegistry);
    let stakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    let proofData = {};
    proofData.contracts = contractAddresses;
    proofData.stake = stakeProofData;

    // write the proof data in to the files.
    writeToFile(STAKE_DATA_PATH, JSON.stringify(proofData));

  });


  it('Generate proof data for "progressStake"', async function () {

    let contractAddresses = getContractAddresses(contractRegistry);
    let stakeProofGenerator = new Stake(contractRegistry);
    let stakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    let progressStakeParams = {
      messageHash: stakeProofData.return_params.messageHash,
      unlockSecret: stakeParams.unlockSecret,
      facilitator: stakeParams.staker,
    };

    let progressStakeProofGenerator = new ProgressStake(contractRegistry);
    let progressStakeProofData =
      await progressStakeProofGenerator.generateProof(progressStakeParams);

    stakeParams.nonce = stakeParams.nonce.addn(1);
    let nextStakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    let proofData = {};
    proofData.contracts = contractAddresses;
    proofData.stake = stakeProofData;
    proofData.progress_stake = progressStakeProofData;
    proofData.next_stake = nextStakeProofData;

    // Write the proof data in to the files.
    writeToFile(PROGRESS_STAKE_DATA_PATH, JSON.stringify(proofData));

  });

  it('Generate proof data for "revertStake"', async function () {

    let contractAddresses = getContractAddresses(contractRegistry);
    let stakeProofGenerator = new Stake(contractRegistry);
    let stakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    let revertStakeParams = {
      messageHash: stakeProofData.return_params.messageHash,
      staker: stakeParams.staker,
    };

    let revertStakeProofGenerator = new RevertStake(contractRegistry);
    let revertStakeProofData =
      await revertStakeProofGenerator.generateProof(revertStakeParams);

    stakeParams.nonce = stakeParams.nonce.addn(1);
    let nextStakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    let proofData = {};
    proofData.contracts = contractAddresses;
    proofData.stake = stakeProofData;
    proofData.revert_stake = revertStakeProofData;
    proofData.next_stake = nextStakeProofData;

    // Write the proof data in to the files.
    writeToFile(REVERT_STAKE_DATA_PATH, JSON.stringify(proofData));

  });

  it('Generate proof data for "confirmStakeIntent"', async function () {

    let contractAddresses = getContractAddresses(contractRegistry);
    let stakeProofGenerator = new Stake(contractRegistry);
    let stakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    stakeParams = {
      amount: new BN(100000000),
      beneficiary: accounts[3],
      gasPrice: new BN(1),
      gasLimit: new BN(10000),
      nonce: new BN(1),
      hashLock: generatedHashLock.l,
      unlockSecret: generatedHashLock.s,
      staker: accounts[0],
    };

    let confirmStakeIntentProofGenerator = new ConfirmStakeIntent(contractRegistry);

    await confirmStakeIntentProofGenerator.setStorageProof(
      stakeProofData.proof_data.block_number,
      stakeProofData.proof_data.storageHash,
    );

    let confirmStakeIntentParams = {
      staker: stakeParams.staker,
      stakerNonce: stakeParams.nonce,
      beneficiary: stakeParams.beneficiary,
      amount: stakeParams.amount,
      gasPrice: stakeParams.gasPrice,
      gasLimit: stakeParams.gasLimit,
      hashLock: stakeParams.hashLock,
      blockHeight: stakeProofData.proof_data.block_number,
      rlpParentNodes: stakeProofData.proof_data.storageProof[0].serializedProof,
      unlockSecret: stakeParams.unlockSecret,
      facilitator: stakeParams.staker,
    };

    let confirmStakeIntentProofData =
      await confirmStakeIntentProofGenerator.generateProof(confirmStakeIntentParams);

    let proofData = {};
    proofData.contracts = contractAddresses;
    proofData.stake = stakeProofData;
    proofData.confirm_stake_intent = confirmStakeIntentProofData;

    // Write the proof data in to the files.
    writeToFile(CONFIRM_STAKE_INTENT_DATA_PATH, JSON.stringify(proofData));

  });

  it('Generate proof data for "confirmStakeIntent"', async function () {

    let contractAddresses = getContractAddresses(contractRegistry);
    let stakeProofGenerator = new Stake(contractRegistry);
    let stakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    stakeParams = {
      amount: new BN(100000000),
      beneficiary: accounts[3],
      gasPrice: new BN(1),
      gasLimit: new BN(10000),
      nonce: new BN(1),
      hashLock: generatedHashLock.l,
      unlockSecret: generatedHashLock.s,
      staker: accounts[0],
    };

    let confirmStakeIntentProofGenerator = new ConfirmStakeIntent(contractRegistry);

    await confirmStakeIntentProofGenerator.setStorageProof(
      stakeProofData.proof_data.block_number,
      stakeProofData.proof_data.storageHash,
    );

    let confirmStakeIntentParams = {
      staker: stakeParams.staker,
      stakerNonce: stakeParams.nonce,
      beneficiary: stakeParams.beneficiary,
      amount: stakeParams.amount,
      gasPrice: stakeParams.gasPrice,
      gasLimit: stakeParams.gasLimit,
      hashLock: stakeParams.hashLock,
      blockHeight: stakeProofData.proof_data.block_number,
      rlpParentNodes: stakeProofData.proof_data.storageProof[0].serializedProof,
      unlockSecret: stakeParams.unlockSecret,
      facilitator: stakeParams.staker,
    };

    let confirmStakeIntentProofData =
      await confirmStakeIntentProofGenerator.generateProof(confirmStakeIntentParams);

    let proofData = {};
    proofData.contracts = contractAddresses;
    proofData.stake = stakeProofData;
    proofData.confirm_stake_intent = confirmStakeIntentProofData;

    // Write the proof data in to the files.
    writeToFile(CONFIRM_STAKE_INTENT_DATA_PATH, JSON.stringify(proofData));

  });

  it('Generate proof data for "progressMint"', async function () {

    let contractAddresses = getContractAddresses(contractRegistry);
    let stakeProofGenerator = new Stake(contractRegistry);
    let stakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    stakeParams = {
      amount: new BN(100000000),
      beneficiary: accounts[3],
      gasPrice: new BN(1),
      gasLimit: new BN(10000),
      nonce: new BN(1),
      hashLock: generatedHashLock.l,
      unlockSecret: generatedHashLock.s,
      staker: accounts[0],
    };

    let confirmStakeIntentProofGenerator = new ConfirmStakeIntent(contractRegistry);

    await confirmStakeIntentProofGenerator.setStorageProof(
      stakeProofData.proof_data.block_number,
      stakeProofData.proof_data.storageHash,
    );

    let confirmStakeIntentParams = {
      staker: stakeParams.staker,
      stakerNonce: stakeParams.nonce,
      beneficiary: stakeParams.beneficiary,
      amount: stakeParams.amount,
      gasPrice: stakeParams.gasPrice,
      gasLimit: stakeParams.gasLimit,
      hashLock: stakeParams.hashLock,
      blockHeight: stakeProofData.proof_data.block_number,
      rlpParentNodes: stakeProofData.proof_data.storageProof[0].serializedProof,
      unlockSecret: stakeParams.unlockSecret,
      facilitator: stakeParams.staker,
    };

    let confirmStakeIntentProofData =
      await confirmStakeIntentProofGenerator.generateProof(confirmStakeIntentParams);

    let progressMintParams = {
      messageHash: stakeProofData.return_params.messageHash,
      unlockSecret: stakeParams.unlockSecret,
      facilitator: stakeParams.staker,
    };

    let progressMintProofGenerator = new ProgressMint(contractRegistry);
    let progressMintProofData =
      await progressMintProofGenerator.generateProof(progressMintParams);

    let proofData = {};
    proofData.contracts = contractAddresses;
    proofData.stake = stakeProofData;
    proofData.confirm_stake_intent = confirmStakeIntentProofData;
    proofData.progress_mint = progressMintProofData;

    // Write the proof data in to the files.
    writeToFile(PROGRESS_MINT_DATA_PATH, JSON.stringify(proofData));

  });

  it('Generate proof data for "confirmRevertStakeIntent"', async function () {

    let contractAddresses = getContractAddresses(contractRegistry);
    let stakeProofGenerator = new Stake(contractRegistry);
    let stakeProofData = await stakeProofGenerator.generateProof(stakeParams);

    let confirmStakeIntentProofGenerator = new ConfirmStakeIntent(contractRegistry);

    await confirmStakeIntentProofGenerator.setStorageProof(
      stakeProofData.proof_data.block_number,
      stakeProofData.proof_data.storageHash,
    );

    let confirmStakeIntentParams = {
      staker: stakeParams.staker,
      stakerNonce: stakeParams.nonce,
      beneficiary: stakeParams.beneficiary,
      amount: stakeParams.amount,
      gasPrice: stakeParams.gasPrice,
      gasLimit: stakeParams.gasLimit,
      hashLock: stakeParams.hashLock,
      blockHeight: stakeProofData.proof_data.block_number,
      rlpParentNodes: stakeProofData.proof_data.storageProof[0].serializedProof,
      unlockSecret: stakeParams.unlockSecret,
      facilitator: stakeParams.staker,
    };


    let confirmStakeIntentProofData =
      await confirmStakeIntentProofGenerator.generateProof(confirmStakeIntentParams);

    let revertStakeParams = {
      messageHash: stakeProofData.return_params.messageHash,
      staker: stakeParams.staker,
    };

    let revertStakeProofGenerator = new RevertStake(contractRegistry);
    let revertStakeProofData =
      await revertStakeProofGenerator.generateProof(revertStakeParams);

    let confirmRevertStakeIntentParams = {
      messageHash: stakeProofData.return_params.messageHash,
      blockHeight: revertStakeProofData.proof_data.block_number,
      rlpParentNodes: revertStakeProofData.proof_data.storageProof[0].serializedProof,
      facilitator: stakeParams.staker,
    };

    let confirmRevertStakeIntentProofGenerator
      = new ConfirmRevertStakeIntent(contractRegistry);

    await confirmRevertStakeIntentProofGenerator.setStorageProof(
      revertStakeProofData.proof_data.block_number,
      revertStakeProofData.proof_data.storageHash,
    );

    let confirmRevertStakeIntentProofData =
      await confirmRevertStakeIntentProofGenerator.generateProof(
        confirmRevertStakeIntentParams
      );

    let proofData = {};
    proofData.contracts = contractAddresses;
    proofData.stake = stakeProofData;
    proofData.confirm_stake_intent = confirmStakeIntentProofData;
    proofData.revert_stake = revertStakeProofData;
    proofData.confirm_revert_stake_intent = confirmRevertStakeIntentProofData;

    // Write the proof data in to the files.
    writeToFile(CONFIRM_REVERT_STAKE_INTENT_DATA_PATH, JSON.stringify(proofData));

  });

  it('Generate proof data for "confirmRevertStakeIntent"', async function () {

    let contractAddresses = getContractAddresses(contractRegistry);
    let stakeProofGenerator = new Stake(contractRegistry);
    let stakeProofData = await stakeProofGenerator.generateProof(stakeParams);


    let confirmStakeIntentProofGenerator = new ConfirmStakeIntent(contractRegistry);

    await confirmStakeIntentProofGenerator.setStorageProof(
      stakeProofData.proof_data.block_number,
      stakeProofData.proof_data.storageHash,
    );

    let confirmStakeIntentParams = {
      staker: stakeParams.staker,
      stakerNonce: stakeParams.nonce,
      beneficiary: stakeParams.beneficiary,
      amount: stakeParams.amount,
      gasPrice: stakeParams.gasPrice,
      gasLimit: stakeParams.gasLimit,
      hashLock: stakeParams.hashLock,
      blockHeight: stakeProofData.proof_data.block_number,
      rlpParentNodes: stakeProofData.proof_data.storageProof[0].serializedProof,
      unlockSecret: stakeParams.unlockSecret,
      facilitator: stakeParams.staker,
    };


    let confirmStakeIntentProofData =
      await confirmStakeIntentProofGenerator.generateProof(confirmStakeIntentParams);


    let revertStakeParams = {
      messageHash: stakeProofData.return_params.messageHash,
      staker: stakeParams.staker,
    };

    let revertStakeProofGenerator = new RevertStake(contractRegistry);
    let revertStakeProofData =
      await revertStakeProofGenerator.generateProof(revertStakeParams);


    let confirmRevertStakeIntentParams = {
      messageHash: stakeProofData.return_params.messageHash,
      blockHeight: revertStakeProofData.proof_data.block_number,
      rlpParentNodes: revertStakeProofData.proof_data.storageProof[0].serializedProof,
      facilitator: stakeParams.staker,
    };

    let confirmRevertStakeIntentProofGenerator
      = new ConfirmRevertStakeIntent(contractRegistry);

    await confirmRevertStakeIntentProofGenerator.setStorageProof(
      revertStakeProofData.proof_data.block_number,
      revertStakeProofData.proof_data.storageHash,
    );

    let confirmRevertStakeIntentProofData =
      await confirmRevertStakeIntentProofGenerator.generateProof(
        confirmRevertStakeIntentParams
      );

    let progressRevertStakeParams = {
      messageHash: stakeProofData.return_params.messageHash,
      blockHeight: confirmRevertStakeIntentProofData.proof_data.block_number,
      rlpParentNodes: confirmRevertStakeIntentProofData.proof_data.storageProof[0].serializedProof,
      facilitator: stakeParams.staker,
    };

    let progressRevertStakeProofGenerator
      = new ProgressRevertStake(contractRegistry);

    await progressRevertStakeProofGenerator.setStorageProof(
      confirmRevertStakeIntentProofData.proof_data.block_number,
      confirmRevertStakeIntentProofData.proof_data.storageHash,
    );

    let progressRevertStakeProofData =
      await progressRevertStakeProofGenerator.generateProof(
        progressRevertStakeParams
      );

    let proofData = {};
    proofData.contracts = contractAddresses;
    proofData.stake = stakeProofData;
    proofData.confirm_stake_intent = confirmStakeIntentProofData;
    proofData.revert_stake = revertStakeProofData;
    proofData.confirm_revert_stake_intent = confirmRevertStakeIntentProofData;
    proofData.progress_revert_stake = progressRevertStakeProofData;

    // Write the proof data in to the files.
    writeToFile(PROGRESS_REVERT_STAKE_DATA_PATH, JSON.stringify(proofData));

  });
});

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
    let outboxPath = utils.storagePath(
      OUTBOX_MESSAGE_BOX_OFFSET,
      [response.messageHash]
    );

    let proof = await utils.getProof(
      contractRegistry.coGateway.address,
      [outboxPath]
    );

    redeemRequest.blockNumber = response.blockNumber;
    redeemRequest.messageHash = response.messageHash;
    redeemRequest.proof = proof;
    proofUtils.generateRedeemTestData(redeemRequest, '/redeem.json');

    await confirmRedeem(contractRegistry, redeemRequest);

    let inboxPath = utils.storagePath(
      INBOX_MESSAGE_BOX_OFFSET,
        [response.messageHash]
    );

    proof = await utils.getProof(
      contractRegistry.gateway.address,
      [inboxPath]
    );
    redeemRequest.proof = proof;
    proofUtils.generateRedeemTestData(redeemRequest, '/confirm_redeem.json');
    response = await progressRedeem(contractRegistry, redeemRequest);

    proof = await utils.getProof(
      contractRegistry.coGateway.address,
      [outboxPath]
    );
    redeemRequest.blockNumber = response.blockNumber;
    redeemRequest.proof = proof;

    proofUtils.generateRedeemTestData(redeemRequest, '/progress_redeem.json');

    response = await  progressUnstake(contractRegistry, redeemRequest);

    proof = await utils.getProof(
      contractRegistry.gateway.address,
      [inboxPath]
    );
    redeemRequest.blockNumber = response.blockNumber;
    redeemRequest.proof = proof;

    proofUtils.generateRedeemTestData(redeemRequest, '/progress_unstake.json');

    redeemRequest.nonce = new BN(2);
    response = await redeem(contractRegistry, redeemRequest);

    proof = await utils.getProof(
      contractRegistry.coGateway.address,
      [outboxPath]
    );
    redeemRequest.blockNumber = response.blockNumber;
    redeemRequest.messageHash = response.messageHash;
    redeemRequest.proof = proof;
    proofUtils.generateRedeemTestData(redeemRequest, '/redeem_2.json');

    await revertRedeem(contractRegistry, redeemRequest);

    proof = await utils.getProof(
      contractRegistry.coGateway.address,
      [outboxPath]
    );
    redeemRequest.blockNumber = response.blockNumber;
    redeemRequest.messageHash = response.messageHash;
    redeemRequest.proof = proof;

    proofUtils.generateRedeemTestData(redeemRequest, '/revert_redeem.json');
  });

});
