import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import { config as dotenvConfig } from "dotenv";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import { NetworksUserConfig } from "hardhat/types";
import { resolve } from "path";
import "solidity-coverage";
import { config } from "./package.json";
import "./tasks/accounts";
import "./tasks/deploy-semaphore";
import "./tasks/deploy-registry";

dotenvConfig({ path: `${__dirname}/.env` });

const accounts = [process.env.BACKEND_PRIVATE_KEY];

const hardhatConfig: HardhatUserConfig = {
  solidity: config.solidity,
  paths: {
    sources: config.paths.contracts,
    tests: config.paths.tests,
    cache: config.paths.cache,
    artifacts: config.paths.build.contracts,
  },
  networks: {
    hardhat: {
      chainId: 8545,
      allowUnlimitedContractSize: true,
    },
    "base-goerli": {
      url: "https://rpc.ankr.com/base_goerli",
      chainId: 84531,
      accounts,
      gasPrice: 1000000000,
    },
    "base": {
      url: "https://rpc.ankr.com/base",
      chainId: 8453,
      accounts,
      gasPrice: 1000000000,
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS === "true",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  typechain: {
    outDir: config.paths.build.typechain,
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: {
      "base-goerli": "PLACEHOLDER_STRING",
      "base": process.env.BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "base-goerli",
        chainId: 84531,
        urls: {
          apiURL: "https://api-goerli.basescan.org/api",
          browserURL: "https://goerli.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
};

export default hardhatConfig;
