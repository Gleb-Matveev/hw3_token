import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnetFork: {
      type: "edr-simulated",
      chainType: "l1",
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/jOQEr5fdFhpCyARWBqDQE",
        blockNumber: 23868254,
      },
      accounts: [
        {
          privateKey:
            "0x1111111111111111111111111111111111111111111111111111111111111111",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x2222222222222222222222222222222222222222222222222222222222222222",
          balance: "10000000000000000000000",
        },
      ],
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
