import hre from "hardhat";
import { hexlify } from "ethers";

import factoryArtifact from "@uniswap/v2-core/build/UniswapV2Factory.json";
import routerArtifact from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import pairArtifact from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import WETH9 from "./WETH9.json";

async function main() {
  //const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  // GENERAL CONFIG
  const connection = await hre.network.connect();
  const [deployer, luckyGuy] = await connection.ethers.getSigners();

  // DEPLOY CONTRACTS
  console.log("Deploying contract with:", deployer.address);

  const MyToken = await connection.ethers.getContractFactory("EVR");
  const token = await MyToken.deploy(
    deployer.address,
    connection.ethers.parseUnits("1000000", 18)
  );

  await token.waitForDeployment();

  console.log("Token deployed to:", token.target);
  console.log(
    "Token balance of deployer: ",
    await token.balanceOf(luckyGuy.address)
  );
  console.log(
    "Token balance of luckyGuy: ",
    await token.balanceOf(luckyGuy.address)
  );
  const tx = await token
    .connect(deployer)
    .transfer(luckyGuy.address, connection.ethers.parseUnits("5000", 18));
  await tx.wait();
  console.log("Token balance: ", await token.balanceOf(luckyGuy.address));

  // One MORE TOKEN
  const USDT = await connection.ethers.getContractFactory("USDT");
  const usdt = await USDT.deploy(
    deployer.address,
    connection.ethers.parseUnits("1000000", 18)
  );

  // UNISWAP SETUP
  const factoryFactory = new connection.ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    deployer
  );
  const factory = await factoryFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  console.log("Factory deployed to:", factory.target);

  const tx1 = await factory.createPair(token.target, usdt.target);
  await tx1.wait();
  const pairAddress = await factory.getPair(token.target, usdt.target);
  console.log("Pair address:", pairAddress);

  const pair = new connection.ethers.Contract(
    pairAddress,
    pairArtifact.abi,
    deployer
  );
  let reserve = await pair.getReserves();
  console.log("Reserves:", reserve);

  const Weth = await new connection.ethers.ContractFactory(
    WETH9.abi,
    WETH9.bytecode,
    deployer
  );
  const weth = await Weth.deploy();
  await weth.waitForDeployment();

  const router = await new connection.ethers.ContractFactory(
    routerArtifact.abi,
    routerArtifact.bytecode,
    deployer
  );
  const routerInstance = await router.deploy(factory.target, weth.target);
  await routerInstance.waitForDeployment();
  console.log("Router deployed to:", routerInstance.target);

  const approveTx = await usdt
    .connect(deployer)
    .approve(routerInstance.target, connection.ethers.parseUnits("10000", 18));
  const approveTx2 = await token
    .connect(deployer)
    .approve(routerInstance.target, connection.ethers.parseUnits("10000", 18));
  await approveTx.wait();
  await approveTx2.wait();

  const addLiqTx = await routerInstance.connect(deployer).addLiquidity(
    usdt.target,
    token.target,
    connection.ethers.parseUnits("10000", 18),
    connection.ethers.parseUnits("10000", 18),
    0,
    0,
    deployer.address,
    Math.floor(Date.now() / 1000) + 60 * 10,
    { gasLimit: 5000000 }
  );
  await addLiqTx.wait();

  reserve = await pair.getReserves();
  console.log("Reserves:", reserve);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
