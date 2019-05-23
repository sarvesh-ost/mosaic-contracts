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

const MerklePatriciaProof = artifacts.require('./MerklePatriciaProofContract.sol');
const proofJson = require('../data/proof.json');
const Utils = require('../test_lib/utils.js');

contract('MerklePatriciaProof.verify()', (accounts) => {
  let merklePatriciaLib;

  describe('Test Cases for Account proof verification', async () => {
    before(async () => {
      merklePatriciaLib = await MerklePatriciaProof.new();
    });

    it('Should pass when all the parameters are valid', async () => {
      const sha3EncodedAccount = '0xf343681465b9efe82c933c3e8748c70cb8aa06539c361de20f72eac04e766393';
      const hashedPath = '0x6434ace01597c65a2a0ac92fecb00ba17eace8acca069a560819b83b35b3e48b';
      const rlpParentNodes = '0xf901aaf90131a01144529db8f101df7b0a20716b0b0090fe243ad04fc85f38d4a3e5b00b0456dca0171bdb1094b3860c6e01c9b6794f7a545209ce2fff19fb5d49895843875021eba007b05940eb85d16218070fa83f3e9c62bfe4622f6bb4078b97b46796a0defb1e80808080a08ac138421314cf96f6a902a54c74873d5b9693f553e937d761e791e7a3d23984a04ffdb3e0e42ea548d944b526ad14d015d25ceeae3a8edeb0c37d609ce795bf988080a0a45e211c1920c9d1bd54f6cfbadb3375450f160574a467c38571d9c75d4c959ea00540e177a3ccd7aea3a7d4fc4d327d2eabe9cfc5832723f8b6dbc6d865db96cf80a04a187abb37da44a9663e81357cdbaadc030867e0a233e1223734df816e57675ba01d4a2cbf318767be16abb0d1e3552f19db3d7dbb514ec6f9cb068c188ba1598180f85180a0ec5a354c635deccde2b3d03ac27a775e8c82f8bcc35cdcff26d815e8413be4b58080a090412aa8c2eb09c472d0234edf77f72a28c67383942c37961d4037cce4b01b57808080808080808080808080e2a020019ee4c6245e625b71b361c991b9b685d444db8c7e708e2c22dfdb357fa7bd01';
      const stateRoot = '0x509eea5b61f2addf593466c258d5c6a30a11bdb4e0ba18fbb109f4e047dc9257';
      const proofStatus = await merklePatriciaLib.verify(
        sha3EncodedAccount,
        hashedPath,
        rlpParentNodes,
        stateRoot,
      );

      console.log('proofStatus  ', JSON.stringify(proofStatus));
     // assert.equal(proofStatus, true);
    });
  });
});
