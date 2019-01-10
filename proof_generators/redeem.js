const EventDecoder = require("../test/test_lib/event_decoder.js");

async function redeem(contractRegistry, redeemRequest) {
  let utilityToken = contractRegistry.mockUtilityToken;
  let coGateway = contractRegistry.coGateway;

  await utilityToken
    .transfer(
      redeemRequest.redeemer,
      redeemRequest.amount,
      {from: contractRegistry.owner}
    );

  await utilityToken.approve(
    coGateway.address,
    redeemRequest.amount,
    {from: redeemRequest.redeemer},
  );

  let tx = await coGateway.redeem(
    redeemRequest.amount,
    redeemRequest.beneficiary,
    redeemRequest.gasPrice,
    redeemRequest.gasLimit,
    redeemRequest.nonce,
    redeemRequest.hashLock,
    {from: redeemRequest.redeemer, value: contractRegistry.bounty},
  );
  let blockNumber = tx.receipt.blockNumber;
  let event = EventDecoder.getEvents(tx, coGateway);
  let eventData = event.RedeemIntentDeclared;

  return {messageHash: eventData._messageHash, blockNumber: blockNumber}
}

module.exports = redeem;