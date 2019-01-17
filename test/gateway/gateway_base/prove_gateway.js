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

const GatewayBase = artifacts.require("./MockGatewayBase.sol")
  , MockAnchor = artifacts.require("./MockAnchor.sol")
  , BN = require('bn.js');

const MockOrganization = artifacts.require('MockOrganization.sol');
const Utils = require('../../../test/test_lib/utils');


contract('GatewayBase.sol', function (accounts) {

  describe('prove gateway', async () => {
    let gatewayBaseInstance;
    let rlpAccount = '0xf8440280a01a5c4442ae7927898551abfc2f6c924051b7a26f3edd504cdc796191aab81e9ea013cf9e0f69514f7a919eb95a8f85499939f0233069dddab648357f63f4959270';
    let rlpParentNodes = '0xf90252f9017180a02aef64c5bb4712a10ffdf60911a7a1bf0b02d10977d6cbe8da48c7328ea2186780a03a5c4fbbd17d7861662c8aded7b4c8ed1dedd4a9e1f2779fed5ed0326578cadca0b1d7f2fb7fd7aefd1ba450036ed6ca87601a70730f9862ce047054eba33c9aaba0a63107c8b7d51b2113f9889205fdd90a01e7c1ccccfd51b3f8fb432881164f9da085ae252f92924dce459ac8708096e9faba0ae464e8e57c623abccb075ccdd1f9a0932e9f7866929a1e310247eea55e66635dd0476c5be81dd73f0c4d7b83e857f6a0e073fb0d55933ecb6e858cbc9ead6b6621ebc51fdd56ee93e7a53024a1ba0b8d8080a0a1ec523f0e4e4d8d57564034b3062f8d1ef465e3bd7a88cbada72bc9f6d96cdda0a3808173e82ac44c99893576eea99baa87212fab1ad74e6bcadd7cfd2ae7702380a03a8d541ab0e00035e9e268a25ec44677174b21e2719e5b316c72134b04dfb646a0c5d80221200bf5778b27adb9c690ed5c5761b2ea60b4548820abb01671be075b80f87180a0ab29433944469f7423924c5bb32e15aa7b6c4fab8cb80432e7fba9db70ccb0c180808080808080a0305f05ec4696004e95e28fa783ab9566e7910d94a3e370b0e14b51e90152d9ff80a004383145d1c2cec73d318f3dc6be3356c3dad42892a5e7e209192a84ab2dfec08080808080f869a0207e84bcf8733dd39fe3b62fdb1f5fbd0365fad12c6f712b6308e14e7d75c7d2b846f8440280a01a5c4442ae7927898551abfc2f6c924051b7a26f3edd504cdc796191aab81e9ea013cf9e0f69514f7a919eb95a8f85499939f0233069dddab648357f63f4959270';
    let stateRoot = '0x70b4172eb30c495bf20b5b12224cd2380fccdd7ffa2292416b9dbdfc8511585d';
    let storageRoot = '0x8c0ee0843488170879578464b1cadcdb7377efa787372405ff373e4cec6a56db';

    beforeEach(async function () {

      let owner = accounts[2]
        , worker = accounts[3]
        , bounty = new BN(100);

      let maxStateRoots = new BN(1000);

      let mockOrganization = await MockOrganization.new(owner, worker);
      let mockAnchor = await MockAnchor.new(
        1,
        0,
        stateRoot,
        maxStateRoots,
        mockOrganization.address,
      );

      gatewayBaseInstance = await GatewayBase.new(
        mockAnchor.address,
        bounty,
        mockOrganization.address,
      );

    });

    it('should be able to prove with correct request', async function () {

      let response = await gatewayBaseInstance.proveGateway(1, rlpAccount, rlpParentNodes);

      let expectedEvent = {
        GatewayProven: {
          _gateway: 0,
          _blockHeight: new BN(1),
          _storageRoot: storageRoot,
          _wasAlreadyProved: false,
        }
      };

      assert.equal(
        response.receipt.status,
        1,
        'Receipt status is unsuccessful',
      );

      let eventData = response.logs;
      await Utils.validateEvents(eventData, expectedEvent);
    });

    it('should return already proven flag as true if already proven', async function () {

      await gatewayBaseInstance.proveGateway(
        2,
        rlpAccount,
        rlpParentNodes,
      );

      let response = await gatewayBaseInstance.proveGateway(
        2,
        rlpAccount,
        rlpParentNodes,
      );

      let expectedEvent = {
        GatewayProven: {
          _gateway: 0,
          _blockHeight: new BN(2),
          _storageRoot: storageRoot,
          _wasAlreadyProved: true,
        }
      };

      assert.equal(
        response.receipt.status,
        1,
        'Receipt status is unsuccessful',
      );

      let eventData = response.logs;

      await Utils.validateEvents(eventData, expectedEvent);
    });

    it('should fail if rlp encoded account is not passed', async function () {

      await Utils.expectThrow(gatewayBaseInstance.proveGateway(1, '0x', rlpParentNodes));

    });

    it('should fail if rlp parent nodes is not passed', async function () {

      await Utils.expectThrow(
        gatewayBaseInstance.proveGateway(1, rlpAccount, '0x')
      );

    });

  });

});
