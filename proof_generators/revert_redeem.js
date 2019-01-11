const EventDecoder = require("../test/test_lib/event_decoder.js");

async function revertRedeem(contractRegistry, progressRedeemRequest) {

  let panelty = contractRegistry.bounty.muln(1.5);

  let tx = await contractRegistry.coGateway.revertRedeem(
    progressRedeemRequest.messageHash,
    {from: progressRedeemRequest.redeemer, value: panelty}
  );
  let blockNumber = tx.receipt.blockNumber;
  let event = EventDecoder.getEvents(tx, contractRegistry.coGateway);
  let eventData = event.RevertRedeemDeclared;

  return {messageHash: eventData._messageHash, blockNumber: blockNumber}
}

module.exports = revertRedeem;