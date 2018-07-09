const openstValueUtils = require('./OpenSTValue_utils')
  , openstUtilityUtils = require('./OpenSTUtility_utils')
  , tokenConversionUtils = require('./TokenConversionPrecision_utils')
  , Core = artifacts.require("./Core.sol")
  , HashLock = require('./lib/hash_lock.js')
;


contract('Token conversion precision test', function (accounts) {
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

    it("Should receive expected number of branded token  on  single stake and  value token on unstake request", async () => {

      const amountST = 2;

      const lock = HashLock.getHashLock();
      let hashLock = lock.l
        , unlockHash = lock.s;

      let decodedStakeEvent = await tokenConversionUtils.processStake(valueToken, openSTValue, amountST, staker, uuid, hashLock, unlockHash)
        , expectedBTValue = (amountST * conversionRate) / 10 ** conversionRateDecimals;
      assert.equal(decodedStakeEvent.BTValue, expectedBTValue, `Minted BT tokens are ${decodedStakeEvent.BTValue} but expected value is ${expectedBTValue}`);
      let BTValue = decodedStakeEvent.BTValue
        , redeemNonce = decodedStakeEvent.nonce + 1;

      let decodeUnStakeEvent = await tokenConversionUtils.processUnstake(openSTValue, uuid, staker, redeemNonce, BTValue, hashLock, registrar);
      assert.equal(amountST, decodeUnStakeEvent.STValue, `Staked value token ${amountST} is not equal to un-staked value token ${decodeUnStakeEvent.STValue}`)
    })


    it("Should receive expected number of value token on unstake request of BT value less then one value token ", async () => {

      const amountST = 2;

      const lock = HashLock.getHashLock();
      let hashLock = lock.l
        , unlockHash = lock.s;

      let decodedStakeEvent = await tokenConversionUtils.processStake(valueToken, openSTValue, amountST, staker, uuid, hashLock, unlockHash)
      /*  , expectedBTValue = (amountST * conversionRate) / 10 ** conversionRateDecimals;
     // assert.equal(decodedStakeEvent.BTValue, expectedBTValue, `Minted BT tokens are ${decodedStakeEvent.BTValue} but expected value is ${expectedBTValue}`);*/
      let BTValue = 5
        , redeemNonce = decodedStakeEvent.nonce + 1
        , expectedST = BTValue * (10 ** conversionRateDecimals) / conversionRate;

      let decodeUnStakeEvent = await tokenConversionUtils.processUnstake(openSTValue, uuid, staker, redeemNonce, BTValue, hashLock, registrar);
      assert.equal(amountST, decodeUnStakeEvent.STValue, `Staked value token ${expectedST} is not equal to un-staked value token ${decodeUnStakeEvent.STValue}`)
    });


    it("Should receive expected number of branded token on multiple stake and one unstake request", async () => {

      const lock = HashLock.getHashLock();
      let hashLock = lock.l
        , unlockHash = lock.s;

      const stakeRequestAmount = [2, 2, 2, 29, 13, 23, 31, 57, 63, 70, 80];
      let totalBTValue = 0;
      let redeemNonce = 0;
      let totalAmountST = 0;
      let totalError = 0;
      for (let i = 0; i < stakeRequestAmount.length; i++) {
        let amountST = stakeRequestAmount[i]
          ,
          decodedStakeEvent = await tokenConversionUtils.processStake(valueToken, openSTValue, amountST, staker, uuid, hashLock, unlockHash);

        totalAmountST += amountST;
        let expectedBT = (amountST * conversionRate) / 10 ** conversionRateDecimals;
        let errorBT = expectedBT - decodedStakeEvent.BTValue;
        totalError += errorBT;
       // console.log(`amount ST ${amountST}   amountBT  ${decodedStakeEvent.BTValue} ,  expected BT ${expectedBT} error  ${expectedBT - decodedStakeEvent.BTValue}`);

        totalBTValue += decodedStakeEvent.BTValue;
        redeemNonce = decodedStakeEvent.nonce + 1;
      }

     // console.log("Total Error BT  ", totalError);

      totalBTValue = 5;
      let decodeUnStakeEvent = await tokenConversionUtils.processUnstake(openSTValue, uuid, staker, redeemNonce, totalBTValue, hashLock, registrar);
      assert.equal(totalAmountST, decodeUnStakeEvent.STValue, `Staked value token ${totalAmountST} is not equal to un-staked value token ${decodeUnStakeEvent.STValue}`)
    });
  });

});