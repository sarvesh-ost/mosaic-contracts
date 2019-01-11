const EventDecoder = require("../test/test_lib/event_decoder.js");

async function progressUnstake(contractRegistry, progressUnstakeRequest) {

  let gateway = contractRegistry.gateway;

  let stakeVault = await gateway.stakeVault.call();

  await contractRegistry.mockToken.transfer(
    stakeVault,
    progressUnstakeRequest.amount,
    {from: contractRegistry.owner}
  );

  let tx = await gateway.progressUnstake(
    progressUnstakeRequest.messageHash,
    progressUnstakeRequest.unlockSecret,
    {from: progressUnstakeRequest.redeemer}
  );
  let blockNumber = tx.receipt.blockNumber;
  let event = EventDecoder.getEvents(tx, gateway);
  let eventData = event.UnstakeProgressed;

  return {messageHash: eventData._messageHash, blockNumber: blockNumber}
}

module.exports = progressUnstake;