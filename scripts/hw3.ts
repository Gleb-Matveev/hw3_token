import hre from "hardhat";

import factoryArtifact from "@uniswap/v2-core/build/UniswapV2Factory.json";
import routerArtifact from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import pairArtifact from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import WETH9 from "./WETH9.json";

async function main() {
  // GENERAL CONFIG
  const connection = await hre.network.connect();
  const [deployer, luckyGuy] = await connection.ethers.getSigners();
  const balance1 = await connection.ethers.provider.getBalance(
    deployer.address
  );
  const balance2 = await connection.ethers.provider.getBalance(
    luckyGuy.address
  );

  console.log("Addr1: ", deployer.address);
  console.log("Addr balance: ", balance1);
  console.log("Addr2: ", luckyGuy.address);
  console.log("Addr balance: ", balance2);

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
  const UniswapV2Factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const UniswapV2Router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const factory = new connection.ethers.Contract(
    UniswapV2Factory,
    factoryArtifact.abi,
    deployer
  );

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

  const weth = new connection.ethers.Contract(wethAddress, WETH9.abi, deployer);
  const routerInstance = await new connection.ethers.Contract(
    UniswapV2Router,
    routerArtifact.abi,
    deployer
  );

  const approveTx = await usdt
    .connect(deployer)
    .approve(routerInstance.target, connection.ethers.parseUnits("10000", 18));
  const approveTx2 = await token
    .connect(deployer)
    .approve(routerInstance.target, connection.ethers.parseUnits("10000", 18));
  await approveTx.wait();
  await approveTx2.wait();

  const addLiqTx = await routerInstance
    .connect(deployer)
    .addLiquidity(
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

  // SWAP TEST
  const amountIn = connection.ethers.parseUnits("10", 18);
  const amountOutMin = 0;
  const path = [token.target, usdt.target];
  const to = deployer.address;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const approveTx2Swap = await token
    .connect(deployer)
    .approve(routerInstance.target, connection.ethers.parseUnits("10000", 18));
  await approveTx2Swap.wait();
  const swapTx = await routerInstance
    .connect(deployer)
    .swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline, {
      gasLimit: 5000000,
    });
  await swapTx.wait();

  console.log(
    "Swap done. EVR balance:",
    (await token.balanceOf(deployer.address)).toString()
  );
  console.log(
    "USDT balance:",
    (await usdt.balanceOf(deployer.address)).toString()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
