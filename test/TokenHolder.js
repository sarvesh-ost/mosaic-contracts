const TokenHolder = artifacts.require("./TokenHolder.sol");
const utils = require("./lib/utils.js");

const Web3 = require('web3')
  , web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


async function buildSignature(accounts, nonce) {
  let signer = accounts[0]
    , msg = web3.utils.soliditySha3(nonce,)
    , prefix = `\x19Ethereum Signed Message:\n${32}`
    , fixed_msg_sha = web3.utils.soliditySha3(prefix, msg);

  let signature = await web3.eth.sign(msg, signer);
  signature = signature.slice(2);

  const r = '0x' + signature.slice(0, 64);
  const s = '0x' + signature.slice(64, 128);
  const v = '0x' + signature.slice(128, 130);

  let v_decimal = web3.utils.toDecimal(v) + 27;
  return {signer, fixed_msg_sha, r, s, v_decimal};
}

contract('Verify Ecrecover', function (accounts) {

  let tokenHolder = null;

  describe('Verify Signer ', async () => {

    before(async () => {
      tokenHolder = await TokenHolder.new();
    })

    it('should verify signer', async function () {

      let nonce = 1;
      let sig = await buildSignature(accounts, nonce);
      let signer = sig.signer;
      let fixed_msg_sha = sig.fixed_msg_sha;
      let r = sig.r;
      let s = sig.s;
      let v_decimal = sig.v_decimal;


      console.log("signer", signer);
      console.log("fixed_msg_sha", fixed_msg_sha);
      console.log("v_decimal", v_decimal);
      console.log("r", r);
      console.log("s", s);

      await tokenHolder.addDevice(signer);
      let result = await tokenHolder.validateSession_2.call(fixed_msg_sha, v_decimal, r, s, nonce);
      assert.equal(result, true);
      result = await tokenHolder.validateSession_2(fixed_msg_sha, v_decimal, r, s, nonce);

      nonce = nonce + 1;
      sig = await buildSignature(accounts, nonce);
      signer = sig.signer;
      fixed_msg_sha = sig.fixed_msg_sha;
      r = sig.r;
      s = sig.s;
      v_decimal = sig.v_decimal;

      result = await tokenHolder.validateSession_2(fixed_msg_sha, v_decimal, r, s, nonce);

      console.log(JSON.stringify(result));
      utils.logResponse(result, "EC recovery");
      utils.printGasStatistics();
      utils.clearReceipts();
    });

    /*
        it('generate sha3', async function () {

          let msg = '0x8CbaC5e4d803bE2A3A5cd3DbE7174504c6DD0c1C';
          let prevSha = web3.utils.soliditySha3(msg);
          for (let i = 0; i < 10; i++) {
            console.log(prevSha);
            prevSha = web3.utils.soliditySha3(prevSha);
          }
        });*/

  });


});

