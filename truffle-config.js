module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        ropsten: {
            provider:"ropsten.infura.io",
            port: 80,
            network_id: '3',
        },
        develop: {
            provider: "127.0.0.1",
            port: 9545,
            network_id: '*',
            gas: 10000001
        },
        local: {
            provider: "192.168.0.127",
            port: 8545,
            network_id: '3',
        },
    }
};
