const EventDecoder = require("../test/test_lib/event_decoder.js");

async function progressRedeem(contractRegistry, progressRedeemRequest) {

  let tx = await contractRegistry.coGateway.progressRedeem(
    progressRedeemRequest.messageHash,
    progressRedeemRequest.unlockSecret,
    {from: progressRedeemRequest.redeemer}
  );

  let blockNumber = tx.receipt.blockNumber;
  let event = EventDecoder.getEvents(tx, contractRegistry.coGateway);
  let eventData = event.RedeemProgressed;

  return {messageHash: eventData._messageHash, blockNumber: blockNumber}
}

module.exports = progressRedeem;