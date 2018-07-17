const TokenHolder = artifacts.require("./TokenHolder.sol");
const utils = require("./lib/utils.js");

const Web3 = require('web3')
  , web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


contract('Verify Ecrecover', function (accounts) {

  let tokenHolder = null;

  describe('Verify Signer ', async () => {

    before(async () => {
      tokenHolder = await TokenHolder.new();
    })

    it('should verify signer', async function () {
      //console.log(web3);
      let rawMsg = '0x8CbaC5e4d803bE2A3A5cd3DbE7174504c6DD0c1C';
      //var rawMsg = '0xb30177d0f1279e3b428b0786027ba7ccae29a1e3915aaff7b0b27d6e83e7e38e';

      //console.log("sha3  ", web3.utils.soliditySha3("0x5569044719a1ec3b04d0afa9e7a5310c7c0473331d13dc9fafe143b2c4e8148a"));

      let signer = accounts[0]
        , msg = web3.utils.sha3(rawMsg)
        , prefix = `\x19Ethereum Signed Message:\n${32}`
        , fixed_msg_sha = web3.utils.soliditySha3(prefix, msg);

      let signature = await web3.eth.sign(msg, signer);
      signature = signature.slice(2);

      const r = '0x' + signature.slice(0, 64);
      const s = '0x' + signature.slice(64, 128);
      const v = '0x' + signature.slice(128, 130);

      let v_decimal = web3.utils.toDecimal(v) + 27;


      console.log("signer", signer);
      console.log("fixed_msg_sha", fixed_msg_sha);
      console.log("v_decimal", v_decimal);
      console.log("r", r);
      console.log("s", s);

      let result = await tokenHolder.validateSession_2(signer, fixed_msg_sha, v_decimal, r, s);
     /* assert.equal(result.logs[0].args.signer, signer);
      assert.equal(result.logs[0].args.status, true);*/

      utils.logResponse(result, "EC recovery");
      utils.printGasStatistics();
      utils.clearReceipts();
    });


    it('generate sha3', async function () {

      let msg = '0x8CbaC5e4d803bE2A3A5cd3DbE7174504c6DD0c1C';
      let prevSha = web3.utils.soliditySha3(msg);
      for (let i = 0; i < 10; i++) {
        console.log(prevSha);
        prevSha = web3.utils.soliditySha3(prevSha);
      }
    });

  });


});

