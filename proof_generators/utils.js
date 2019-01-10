const fs = require('fs');
const path = require('path');

const DATA_PATH = 'test/data';

class Utils {

  constructor(contractRegistry) {
    this.contractRegistry = contractRegistry;
  }

  generateStakeTestData(stakeRequest) {
    Utils.writeToFile(DATA_PATH + '/stake.json', stakeRequest,);
  }

  generateRedeemTestData(redeemRequest) {

    redeemRequest.storageRoot = redeemRequest.proof.result.storageHash;
    redeemRequest.storageProof = redeemRequest.proof.result.storageProof[0].serializedProof;
    redeemRequest.gateway = this.contractRegistry.gateway.address;
    redeemRequest.coGateway = this.contractRegistry.coGateway.address;
    redeemRequest.bounty = this.contractRegistry.bounty;
    redeemRequest.organization = this.contractRegistry.organization.address;
    redeemRequest.mockToken = this.contractRegistry.mockToken.address;
    redeemRequest.baseToken = this.contractRegistry.baseToken.address;
    redeemRequest.mockUtilityToken = this.contractRegistry.mockUtilityToken.address;
    redeemRequest.anchor = this.contractRegistry.anchor.address;
    redeemRequest.owner = this.contractRegistry.owner;

    Utils.writeToFile(DATA_PATH + '/redeem.json', JSON.stringify(redeemRequest, null, 2));
  };

  /**
   * Write proof data in the file.
   *
   * @param {string} location Location where the file will be written.
   * @param {string} content The content that will be written in the file.
   *
   */
  static writeToFile(location, content) {

    let rootDir = `${__dirname}/../`;

    const pathLocation = path.join(rootDir, location);

    fs.writeFile(pathLocation, content, function (err) {
      if (err) {
        throw err;
      }
    });
  }

}

module.exports = Utils;