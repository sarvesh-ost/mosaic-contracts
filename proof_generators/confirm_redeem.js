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
    '0x'+confirmRedeemRequest.storageProof,
  );
}

module.exports = confirmRedeem;