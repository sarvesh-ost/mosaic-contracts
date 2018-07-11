const openstValueUtils = require('./OpenSTValue_utils')
  , openstUtilityUtils = require('./OpenSTUtility_utils')
  , Core = artifacts.require("./Core.sol")
;

module.exports.deployContracts = async function (artifacts, accounts, registrar, chainIdValue, chainIdUtility) {

  let utilityContract = await openstUtilityUtils.deployOpenSTUtility(artifacts, accounts);
  let valueContract = await openstValueUtils.deployOpenSTValue(artifacts, accounts)
    , workers = valueContract.workers;
  let core = await Core.new(registrar, chainIdValue, chainIdUtility, utilityContract.openSTUtility.address, workers.address);
  return {utilityContract, valueContract, core};
}


module.exports.decodeStakeEvent = function (log) {
  let STValue = log.args._amountST.toNumber()
    , BTValue = log.args._amountUT.toNumber()
    , nonce = log.args._stakerNonce.toNumber()
    , stakingIntentHash = log.args._stakingIntentHash
  ;
  return {
    STValue: STValue,
    BTValue: BTValue,
    nonce: nonce,
    stakingIntentHash: stakingIntentHash
  }
};

module.exports.decodeUnStakeEvent = function (log) {
  let STValue = log.args._amountST.toNumber()
    , BTValue = log.args._amountUT.toNumber()
  ;
  return {
    STValue: STValue,
    BTValue: BTValue,
  }
};


module.exports.processStake = async function (valueToken, openSTValue, amountST, staker, uuid, hashLock, unlockHash) {

  await valueToken.approve(openSTValue.address, amountST, {from: staker});

  let receipt = await openSTValue.stake(uuid, amountST, staker, hashLock, staker, {from: staker})
    , decodedStakeEvent = this.decodeStakeEvent(receipt.logs[0]);

  await openSTValue.processStaking(decodedStakeEvent.stakingIntentHash, unlockHash);
  return decodedStakeEvent;
};

module.exports.processUnstake = async function (openSTValue, uuid, staker, redeemNonce, BTValue, hashLock, registrar) {
  let redemptionUnlockHeight = 10
    , redemptionIntentHash = await openSTValue.hashRedemptionIntent(uuid, staker, redeemNonce, staker,
    BTValue, redemptionUnlockHeight, hashLock)

    , receipt = await openSTValue.confirmRedemptionIntent(uuid, staker, redeemNonce, staker, BTValue,
    redemptionUnlockHeight, hashLock, redemptionIntentHash, {from: registrar});

  return this.decodeUnStakeEvent(receipt.logs[0]);
};

