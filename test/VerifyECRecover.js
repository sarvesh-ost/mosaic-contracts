const VerifyECRecover = artifacts.require("./VerifyECRecover.sol");
const utils = require("./lib/utils.js");

const Web3 = require('web3')
  , web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


contract('Verify Ecrecover', function (accounts) {

  let verifyECRecover = null;

  describe('Verify Signer ', async () => {

    before(async () => {
      verifyECRecover = await VerifyECRecover.new();
    })

    it('should verify signer', async function () {
      //console.log(web3);
      let signer = accounts[0]
        , msg = web3.utils.sha3('0x8CbaC5e4d803bE2A3A5cd3DbE7174504c6DD0c1C')
        , prefix = `\x19Ethereum Signed Message:\n${32}`
        , fixed_msg_sha = web3.utils.soliditySha3(prefix, msg);

      let signature = await web3.eth.sign(msg, signer);
      signature = signature.slice(2);

      const r = '0x' + signature.slice(0, 64);
      const s = '0x' + signature.slice(64, 128);
      const v = '0x' + signature.slice(128, 130);

      let v_decimal = web3.utils.toDecimal(v) + 27;

      let result = await verifyECRecover.isSigned(signer, fixed_msg_sha, v_decimal, r, s);
     /* assert.equal(result.logs[0].args.signer, signer);
      assert.equal(result.logs[0].args.status, true);*/

      utils.logResponse(result, "EC recovery");
      utils.printGasStatistics();
      utils.clearReceipts();
    });

  });

});