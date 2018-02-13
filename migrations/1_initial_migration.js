var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations, {
    gasPrice: 1000000000,
    gas: 1000000
  });
};
