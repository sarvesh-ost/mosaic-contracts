const EventDecoder = require("../test/test_lib/event_decoder.js");

async function confirmRedeem(contractRegistry, confirmRedeemRequest) {

  let gateway = contractRegistry.gateway;

  await gateway.setStorageRoot(
    confirmRedeemRequest.blockNumber,
    confirmRedeemRequest.storageRoot
  );

  let tx = await gateway.confirmRedeemIntent(
    confirmRedeemRequest.redeemer,
    confirmRedeemRequest.nonce,
    confirmRedeemRequest.beneficiary,
    confirmRedeemRequest.amount,
    confirmRedeemRequest.gasPrice,
    confirmRedeemRequest.gasLimit,
    confirmRedeemRequest.blockNumber,
    confirmRedeemRequest.hashLock,
    confirmRedeemRequest.storageProof,
  );

  let blockNumber = tx.receipt.blockNumber;
  let event = EventDecoder.getEvents(tx, gateway);
  let eventData = event.RedeemIntentConfirmed;

  return {messageHash: eventData._messageHash, blockNumber: blockNumber}
}

module.exports = confirmRedeem;