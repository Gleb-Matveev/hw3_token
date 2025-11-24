import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("USDTModule", (m) => {
  const evr = m.contract("USDT");

  return { evr };
});
