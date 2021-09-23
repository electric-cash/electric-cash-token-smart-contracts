const Welcash = artifacts.require("Welcash");
const TwoKeyController = artifacts.require("TwoKeyController");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Welcash);
  await deployer.deploy(TwoKeyController, Welcash.address, [accounts[0], accounts[1]]);
  (await Welcash.deployed()).transferOwnership(TwoKeyController.address);
};
