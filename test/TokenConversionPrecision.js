const tokenConversionUtils = require('./TokenConversionPrecision_utils')
  , HashLock = require('./lib/hash_lock.js')
;


contract('Token conversion precision test', function (accounts) {
  const registrar = accounts[1];


  describe(' Value token to Branded Token precision test when Value token has more value than branded token', async () => {

    let openSTValue, openSTUtility, staker = accounts[0],
      chainIdValue = 3, chainIdUtility = 1, valueToken, uuid;

    let symbol = 'BT'
      , name = 'Branded Token'
      , conversionRate = 599
      , conversionRateDecimals = 2
    ;

    before(async () => {
      let {utilityContract, valueContract, core} = await tokenConversionUtils.deployContracts(artifacts, accounts, registrar, chainIdValue, chainIdUtility);

      openSTUtility = utilityContract.openSTUtility;
      valueToken = valueContract.valueToken;
      staker = valueContract.deployer;
      openSTValue = valueContract.openSTValue;
      await openSTValue.addCore(core.address, {from: registrar});

      uuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate, conversionRateDecimals);
      await registerTokenValue(symbol, name, conversionRate, conversionRateDecimals, uuid);
    });


    async function registerTokenValue(symbol, name, conversionRate, conversionRateDecimals, uuid) {
      await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdUtility, staker, uuid, {from: registrar});
    }

    it("Should receive expected number of branded token  on  single stake and  value token on unstake request", async () => {

      const amountSTInWei = 2;

      const lock = HashLock.getHashLock();
      let hashLock = lock.l
        , unlockHash = lock.s;

      let decodedStakeEvent = await tokenConversionUtils.processStake(valueToken, openSTValue, amountSTInWei, staker, uuid, hashLock, unlockHash)
        , expectedBTValue = (amountSTInWei * conversionRate) / 10 ** conversionRateDecimals;
      assert.equal(decodedStakeEvent.BTValue, expectedBTValue, `Minted BT tokens are ${decodedStakeEvent.BTValue} but expected value is ${expectedBTValue}`);
      let BTValueInWei = decodedStakeEvent.BTValue
        , redeemNonce = decodedStakeEvent.nonce + 1;

      let decodeUnStakeEvent = await tokenConversionUtils.processUnstake(openSTValue, uuid, staker, redeemNonce, BTValueInWei, hashLock, registrar);
      assert.equal(amountSTInWei, decodeUnStakeEvent.STValue, `Staked value token ${amountSTInWei} is not equal to un-staked value token ${decodeUnStakeEvent.STValue}`)
    });


    it("Should receive expected number of value token on unstake request of BT value less then one value token ", async () => {

      const amountST = 2;

      const lock = HashLock.getHashLock();
      let hashLock = lock.l
        , unlockHash = lock.s;

      let decodedStakeEvent = await tokenConversionUtils.processStake(valueToken, openSTValue, amountST, staker, uuid, hashLock, unlockHash)
      let BTValueInWei = 5
        , redeemNonce = decodedStakeEvent.nonce + 1
        , expectedST = BTValueInWei * (10 ** conversionRateDecimals) / conversionRate;

      let decodeUnStakeEvent = await tokenConversionUtils.processUnstake(openSTValue, uuid, staker, redeemNonce, BTValueInWei, hashLock, registrar);
      assert.equal(amountST, decodeUnStakeEvent.STValue, `Staked value token ${expectedST} is not equal to un-staked value token ${decodeUnStakeEvent.STValue}`)
    });


    it("Should receive expected number of branded token on multiple stake and one unstake request", async () => {

      const lock = HashLock.getHashLock();
      let hashLock = lock.l
        , unlockHash = lock.s;

      const stakeRequestAmount = [2, 2, 2, 29, 13, 23, 31, 57, 63, 70, 80, 2, 2, 2, 29, 13, 23, 31, 57, 63, 70, 80];
      let totalBTValueInWei = 0;
      let redeemNonce = 0;
      let totalAmountSTInWei = 0;
      let totalError = 0;
      for (let i = 0; i < stakeRequestAmount.length; i++) {
        let amountST = stakeRequestAmount[i]
          ,
          decodedStakeEvent = await tokenConversionUtils.processStake(valueToken, openSTValue, amountST, staker, uuid, hashLock, unlockHash);

        totalAmountSTInWei += amountST;
        let expectedBT = (amountST * conversionRate) / 10 ** conversionRateDecimals;
        totalError += expectedBT - decodedStakeEvent.BTValue;

        totalBTValueInWei += decodedStakeEvent.BTValue;
        redeemNonce = decodedStakeEvent.nonce + 1;
      }
      console.log("total BT valuee   ", totalBTValueInWei);
      let decodeUnStakeEvent = await tokenConversionUtils.processUnstake(openSTValue, uuid, staker, redeemNonce, totalBTValueInWei, hashLock, registrar);
      assert.equal(totalAmountSTInWei, decodeUnStakeEvent.STValue, `Staked value token ${totalAmountSTInWei} is not equal to un-staked value token ${decodeUnStakeEvent.STValue}`)
    });
  });

  describe(' Value token to Branded Token precision test when Value token has less value than branded token', async () => {

    let openSTValue, openSTUtility, staker = accounts[0],
      chainIdValue = 3, chainIdUtility = 1, valueToken, uuid;

    let symbol = 'BT'
      , name = 'Branded Token'
      , conversionRate = 1
      , conversionRateDecimals = 5
    ;

    before(async () => {
      let {utilityContract, valueContract, core} = await tokenConversionUtils.deployContracts(artifacts, accounts, registrar, chainIdValue, chainIdUtility);

      openSTUtility = utilityContract.openSTUtility;
      valueToken = valueContract.valueToken;
      staker = valueContract.deployer;
      openSTValue = valueContract.openSTValue;
      await openSTValue.addCore(core.address, {from: registrar});

      uuid = await openSTValue.hashUuid.call(symbol, name, chainIdValue, chainIdUtility, openSTUtility.address, conversionRate, conversionRateDecimals);
      await registerTokenValue(symbol, name, conversionRate, conversionRateDecimals, uuid);
    });


    async function registerTokenValue(symbol, name, conversionRate, conversionRateDecimals, uuid) {
      await openSTValue.registerUtilityToken(symbol, name, conversionRate, conversionRateDecimals, chainIdUtility, staker, uuid, {from: registrar});
    }

    it("Should receive expected number of branded token  on  single stake and  value token on unstake request", async () => {

      const amountSTInWei = 100000;

      const lock = HashLock.getHashLock();
      let hashLock = lock.l
        , unlockHash = lock.s;

      let decodedStakeEvent = await tokenConversionUtils.processStake(valueToken, openSTValue, amountSTInWei, staker, uuid, hashLock, unlockHash)
        , expectedBTValue = (amountSTInWei * conversionRate) / 10 ** conversionRateDecimals;
      assert.equal(decodedStakeEvent.BTValue, expectedBTValue, `Minted BT tokens are ${decodedStakeEvent.BTValue} but expected value is ${expectedBTValue}`);
      let BTValueInWei = decodedStakeEvent.BTValue
        , redeemNonce = decodedStakeEvent.nonce + 1;

      let decodeUnStakeEvent = await tokenConversionUtils.processUnstake(openSTValue, uuid, staker, redeemNonce, BTValueInWei, hashLock, registrar);
      assert.equal(amountSTInWei, decodeUnStakeEvent.STValue, `Staked value token ${amountSTInWei} is not equal to un-staked value token ${decodeUnStakeEvent.STValue}`)
    });


  });

});