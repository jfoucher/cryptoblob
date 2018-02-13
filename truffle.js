var HDWalletProvider = require("truffle-hdwallet-provider");
var env = require('dotenv');
env.config();
var mnemonic = process.env.WEB3_MNEMONIC;

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
    networks: {
        rinkeby: {
            provider: function() {
                return new HDWalletProvider(mnemonic, "https://rinkedby.infura.io/KVcacQRdiG5AMrNG0hy1")
            },
            network_id: 4
        },
        // provider: new https://rinkeby.infura.io/KVcacQRdiG5AMrNG0hy1
        ropsten: {
            provider: function() {
                return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/KVcacQRdiG5AMrNG0hy1")
            },
            network_id: 3,
            gas: 4000001
        },
        develop: {
            provider: "127.0.0.1",
            port: 9545,
            network_id: '*',
            gas: 5000001,
            gasPrice: 1000
        },
        local: {
            provider: "192.168.0.127",
            port: 8545,
            network_id: '3',
        },
    }
};
