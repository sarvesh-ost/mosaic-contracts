const EventDecoder = require("../test/test_lib/event_decoder.js");

async function progressRevertRedeem(contractRegistry, revertRedeemRequest) {
  let coGateway = contractRegistry.coGateway;

  await coGateway.setStorageRoot(
    revertRedeemRequest.blockNumber,
    revertRedeemRequest.storageRoot
  );

  let tx = await coGateway.progressRevertRedeem(
    revertRedeemRequest.messageHash,
    revertRedeemRequest.blockNumber,
    revertRedeemRequest.storageProof,
  );


  let blockNumber = tx.receipt.blockNumber;
  let event = EventDecoder.getEvents(tx, coGateway);
  let eventData = event.RedeemReverted;

  return {messageHash: eventData._messageHash, blockNumber: blockNumber}
}

module.exports = progressRevertRedeem;