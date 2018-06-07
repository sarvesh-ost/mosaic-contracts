const Proxy = artifacts.require('./Proxy.sol');
const NewContract = artifacts.require('./NewContract.sol');
const OldContract = artifacts.require('./OldContract.sol');
const ContractStorage = artifacts.require('./ContractStorage.sol');


module.exports.deployContracts = async (artifacts, accounts) => {
  const contractStorage = await  ContractStorage.new({from: accounts[0]});
  const newContract = await NewContract.new({from: accounts[0]});
  const oldContract = await OldContract.new({from: accounts[0]});
  const proxy = await Proxy.new(contractStorage.address, {from: accounts[0]});

  return {
    contractStorage: contractStorage,
    newContract: newContract,
    oldContract: oldContract,
    proxy: proxy
  };

};
