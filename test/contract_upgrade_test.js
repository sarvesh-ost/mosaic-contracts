const NewContract = artifacts.require('./NewContract.sol');
const OldContract = artifacts.require('./OldContract.sol');

const deployUtils = require('./deploy_upgradable_contract_util');

contract('Contract Upgrade', function (accounts) {

  describe('Check Storage is shared if contract is migrated', async () => {
    let contractStorage;
    let newContract;
    let oldContract;
    let proxy;

    before(async () => {
      let deployedContract = await deployUtils.deployContracts(artifacts, accounts);
      contractStorage = deployedContract.contractStorage;
      newContract = deployedContract.newContract;
      oldContract = deployedContract.oldContract;
      proxy = deployedContract.proxy;

      let reciept = await proxy.upgradeTo(oldContract.address, {from: accounts[0]});
      proxy = _.extend(proxy, OldContract.at(proxy.address));
      await proxy.add(1);
      await proxy.add(2);
      await proxy.add(3);
    });

    it('test with old and then new contract', async () => {

      let bestElement = await proxy.findBestElement.call();
      assert.equal(bestElement, 3);
      await proxy.upgradeTo(newContract.address, {from: accounts[0]});
      proxy = _.extend(proxy, NewContract.at(proxy.address));
      bestElement = await proxy.findBestElement.call();
      assert.equal(bestElement, 1);
    });
  });

});