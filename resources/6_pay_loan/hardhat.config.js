require("@nomiclabs/hardhat-waffle");
const { PRIVATE_KEY } = require("./utils/private_key");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.5.5",
            },
            {
                version: "0.6.6",
            },
            {
                version: "0.8.0",
            },
        ],
    },
    networks: {
        hardhat: {
            forking: {
                // "url": "https://bsc-dataseed.bnbchain.org",
                // "url": "https://bsc-dataseed.nariox.org",
                // "url": "https://bsc-dataseed.defibit.io",
                // "url": "https://bsc-dataseed.ninicoin.io",
                // "url": "https://bsc.nodereal.io",
                // "url": "https://bsc-dataseed-public.bnbchain.org",
                // "url": "https://bnb.rpc.subquery.network/public",
                // "url": "https://bnb-testnet.g.alchemy.com/v2/4aw-gp2kgdQQvI3kb1UNN",
                "url": "https://bnb-mainnet.g.alchemy.com/v2/LHXTohiQVpKrwTRbWzvCT"
            },
        },
        testnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            accounts: ["0x45660f260581ddd76bb1f39c9a92f64f638e244c475ee5157b29f46178324183"],
        },
        mainnet: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            accounts: ["0x45660f260581ddd76bb1f39c9a92f64f638e244c475ee5157b29f46178324183"],
        },
        sepolia: {
            url: `https://eth-sepolia.g.alchemy.com/v2/_cOAd2OKemI3n-DhLIblOboDNbjJZ0zl`,
            accounts: ["0x45660f260581ddd76bb1f39c9a92f64f638e244c475ee5157b29f46178324183"]
        }
    },
};
