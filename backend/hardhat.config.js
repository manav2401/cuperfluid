require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const rpcProvider = process.env.RPC_PROVIDER_ENDPOINT;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	defaultNetwork: "mumbai",
	networks: {
		mumbai: {
			url: rpcProvider,
			accounts: [PRIVATE_KEY],
			gas: 6721975,
			gasPrice: 20000000000,
		},
	},
	solidity: "0.8.0",
};
