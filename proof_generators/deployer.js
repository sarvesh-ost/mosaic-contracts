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
const web3 = require("../test/test_lib/web3.js");
const Utils = require("../test/test_lib/utils.js");

const MockOrganization = artifacts.require('MockOrganization.sol');
const Anchor = artifacts.require("./Anchor.sol");
const Gateway = artifacts.require("TestEIP20Gateway");
const CoGateway = artifacts.require("TestEIP20CoGateway");
const MockToken = artifacts.require("MockToken");
const MockUtilityToken = artifacts.require("MockUtilityToken");


/**
 * Deploy the contracts for proof generation.
 *
 * @param {Array} accounts An array of available accounts.
 *
 * @returns {Object} Object containing the deployed contracts.
 */
async function deployer(accounts) {

  let owner = accounts[0];
  let worker = accounts[1];
  let remoteChainId = new BN(1410);
  let blockHeight = new BN(5);
  let stateRoot = web3.utils.sha3("dummy_state_root");
  let maxNumberOfStateRoots = new BN(10);
  let bounty = new BN(100);
  let organization = await MockOrganization.new(owner, worker);
  let burner = Utils.NULL_ADDRESS;

  let anchor = await Anchor.new(
    remoteChainId,
    blockHeight,
    stateRoot,
    maxNumberOfStateRoots,
    organization.address,
  );

  let mockToken = await MockToken.new({from: accounts[0]});
  let baseToken = await MockToken.new({from: accounts[0]});

  let mockUtilityToken = await MockUtilityToken.new(
    mockToken.address,
    "",
    "",
    18,
    organization.address,
    {from: owner},
  );

  let gateway = await Gateway.new(
    mockToken.address,
    baseToken.address,
    anchor.address,
    bounty,
    organization.address,
    burner
  );

  let coGateway = await CoGateway.new(
    mockToken.address,
    mockUtilityToken.address,
    anchor.address,
    bounty,
    organization.address,
    gateway.address,
    burner
  );

  await mockUtilityToken.setCoGateway(coGateway.address, {from: owner});

  await gateway.activateGateway(coGateway.address, {from: owner});

  return {
    gateway: gateway,
    coGateway: coGateway,
    organization: organization,
    mockToken: mockToken,
    baseToken: baseToken,
    mockUtilityToken: mockUtilityToken,
    anchor: anchor,
    owner: owner,
    worker: worker,
    bounty: bounty
  }

}

module.exports = deployer;