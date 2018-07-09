const openstValueUtils = require('./OpenSTValue_utils')
  , openstUtilityUtils = require('./OpenSTUtility_utils')
  , tokenConversionUtils = require('./TokenConversionPrecision_utils')
  , Core = artifacts.require("./Core.sol")
  , HashLock = require('./lib/hash_lock.js')
;


contract('Token conversion', function (accounts) {
  const registrar = accounts[1];


  describe(' Branded Token precision test', async () => {

    let openSTValue, openSTUtility, staker = accounts[0],
      chainIdValue = 3, chainIdUtility = 1, valueToken, uuid;

    let symbol = 'BT'
      , name = 'Branded Token'
      , conversionRate = 599
      , conversionRateDecimals = 2
    ;

    before(async () => {

      let utilityContract = await openstUtilityUtils.deployOpenSTUtility(artifacts, accounts);
      openSTUtility = utilityContract.openSTUtility;

      let valueContract = await openstValueUtils.deployOpenSTValue(artifacts, accounts)
        , workers = valueContract.workers;

      openSTValue = valueContract.openSTValue;
      valueToken = valueContract.valueToken;
      staker = valueContract.deployer;

      let core = await Core.new(registrar, chainIdValue, chainIdUtility, openSTUtility.address, workers.address);
      await openSTValue.addCore(core.address, {from: registrar});

      uuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate, conversionRateDecimals);
      await registerTokenValue(symbol, name, conversionRate, conversionRateDecimals, uuid);
    });


    async function registerTokenValue(symbol, name, conversionRate, conversionRateDecimals, uuid) {
      await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdUtility, staker, uuid, {from: registrar});
    }

    it("Should receive expected number of branded token on stake", async () => {

      const amountST = 2;

      const lock = HashLock.getHashLock();
      let hashLock = lock.l
        , unlockHash = lock.s;

      let decodedStakeEvent = await tokenConversionUtils.processStake(valueToken, openSTValue, amountST, staker, uuid, hashLock, unlockHash);

      let BTValue = decodedStakeEvent.BTValue
        , redeemNonce = decodedStakeEvent.nonce + 1;

      let decodeUnStakeEvent = await tokenConversionUtils.processUnstake(openSTValue, uuid, staker, redeemNonce, BTValue, hashLock, registrar);
      assert.equal(amountST, decodeUnStakeEvent.STValue, `Staked value token ${amountST} is not equal to un-staked value token ${decodeUnStakeEvent.STValue}`)
    });
  });

});