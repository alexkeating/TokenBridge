import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

import "./tasks/accounts";
import "./tasks/clean";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  // arbitrum: ,
  goerli: 5,
  kovan: 42,
  hardhat: 1337,
  mainnet: 1,
  // optimism: ,
  polygonmainnet: 137,
  polygonmumbai: 80001,
  rinkeby: 4,
  ropsten: 3,
  // xdai: 100,
};

// Ensure that we have all the environment variables we need.
const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
if (!etherscanApiKey) {
  throw new Error("Please set your ETHERSCAN_API_KEY in a .env file");
}

function createInfuraRpcUrl(network: keyof typeof chainIds): string {
  let net: string;
  if (network.startsWith("polygon")) {
    net = network.replace("polygon", "polygon-");
  } else {
    net = network;
  }
  return "https://" + net + ".infura.io/v3/" + infuraApiKey;
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
    coinmarketcap: process.env.REPORT_GAS ? process.env.COINMARKETCAP_API_KEY : "",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
      tags: ["test"],
    },
    goerli: {
      accounts: {
        mnemonic,
      },
      url: createInfuraRpcUrl("goerli"),
      chainId: chainIds.hardhat,
      tags: ["stage"],
    },
    kovan: {
      accounts: {
        mnemonic,
      },
      url: createInfuraRpcUrl("kovan"),
      chainId: chainIds.hardhat,
      tags: ["stage"],
    },
    rinkeby: {
      accounts: {
        mnemonic,
      },
      url: createInfuraRpcUrl("rinkeby"),
      chainId: chainIds.hardhat,
      tags: ["stage"],
    },
    ropsten: {
      accounts: {
        mnemonic,
      },
      url: createInfuraRpcUrl("ropsten"),
      chainId: chainIds.hardhat,
      tags: ["stage"],
    },
    polygon: {
      accounts: {
        mnemonic,
      },
      url: createInfuraRpcUrl("polygonmainnet"),
      chainId: chainIds.hardhat,
      tags: ["prod"],
    },
    mumbai: {
      accounts: {
        mnemonic,
      },
      url: createInfuraRpcUrl("polygonmumbai"),
      chainId: chainIds.hardhat,
      tags: ["stage"],
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: etherscanApiKey,
  },
  solidity: {
    version: "0.8.6",
    settings: {
      // You should disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
};

export default config;
