const EventDecoder = require("../test/test_lib/event_decoder.js");

async function confirmRevertRedeemIntent(contractRegistry, revertRedeemRequest) {

  let gateway = contractRegistry.gateway;

  await gateway.setStorageRoot(
    revertRedeemRequest.blockNumber,
    revertRedeemRequest.storageRoot
  );

  let tx = await gateway.confirmRevertRedeemIntent(
    revertRedeemRequest.messageHash,
    revertRedeemRequest.blockNumber,
    revertRedeemRequest.storageProof,
  );
  let blockNumber = tx.receipt.blockNumber;
  let event = EventDecoder.getEvents(tx, contractRegistry.gateway);
  let eventData = event.RevertRedeemIntentConfirmed;
  return {messageHash: eventData._messageHash, blockNumber: blockNumber}
}

module.exports = confirmRevertRedeemIntent;