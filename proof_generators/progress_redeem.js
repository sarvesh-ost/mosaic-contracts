const EventDecoder = require("../test/test_lib/event_decoder.js");

async function progressRedeem(contractRegistry, progressRedeemRequest) {

  console.log("progressRedeemRequest.messageHash , ", progressRedeemRequest.messageHash);
  console.log("progressRedeemRequest.unlockSecret , ", progressRedeemRequest.unlockSecret);

  let response = await contractRegistry.coGateway.progressRedeem.call(
    progressRedeemRequest.messageHash,
    progressRedeemRequest.unlockSecret,
    {from: progressRedeemRequest.redeemer}
  );
  console.log("response for proress redeem  ", response);

  let tx = await contractRegistry.coGateway.progressRedeem(
    progressRedeemRequest.messageHash,
    progressRedeemRequest.unlockSecret,
    {from: progressRedeemRequest.redeemer}
  );
  console.log("tx  ", tx);

  let blockNumber = tx.receipt.blockNumber;
  let event = EventDecoder.getEvents(tx, contractRegistry.coGateway);
  let eventData = event.RedeemProgressed;

  return {messageHash: eventData._messageHash, blockNumber: blockNumber}
}

module.exports = progressRedeem;