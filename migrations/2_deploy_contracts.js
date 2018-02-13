// var Utils = artifacts.require("./Utils.sol");
// var CryptoBlob = artifacts.require("./CryptoBlob.sol");
var BlobCore = artifacts.require("./BlobCore.sol");
var BlobFood = artifacts.require("./BlobFood.sol");
var Eth = require('ethjs');

module.exports = function(deployer) {
  // deployer.link(Utils, CryptoBlob);
  deployer.deploy(BlobCore, {
    gas: 4000000,
  }).then(() => {

      console.log('result', BlobCore.address);
      for(var i = 0; i<10;i++) {
        BlobCore.at(BlobCore.address).generateBlob(Math.round(Math.random() * 1000000000));
      }
      
      // console.log(Eth.toWei(0.01, 'ether').toString(10));
      BlobCore.at(BlobCore.address).createFood('Hamburger', 39, Eth.toWei(0.01, 'ether').toString(10));
      BlobCore.at(BlobCore.address).createFood('Candy', 49, Eth.toWei(0.001, 'ether').toString(10));
      BlobCore.at(BlobCore.address).createFood('Kale', 13, Eth.toWei(0.005, 'ether').toString(10));
      BlobCore.at(BlobCore.address).createFood('Medicine', 12, Eth.toWei(0.03, 'ether').toString(10));
  }).catch((err) => {
    console.log('error', err);
  });
  // deployer.deploy(Test);
};
