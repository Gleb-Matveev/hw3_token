import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EVRModule", (m) => {
  const evr = m.contract("EVR");

  return { evr };
});
