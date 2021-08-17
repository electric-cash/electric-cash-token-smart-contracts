const Welcash = artifacts.require("Welcash");

module.exports = function (deployer) {
  deployer.deploy(Welcash);
};
