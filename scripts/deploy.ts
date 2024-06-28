import { ethers } from "hardhat";

async function main() {
  // constructor arguments: host address and supported supertoken address(fDAIx on op sepolia)
  // Optimism Sepolia: https://console.superfluid.finance/optimism-sepolia/protocol
  const contractInstance = await ethers.deployContract("FlowCraft", [
    "0xd399e2Fb5f4cf3722a11F65b88FAB6B2B8621005",
    "0xD6FAF98BeFA647403cc56bDB598690660D5257d2"
  ]);
  await contractInstance.waitForDeployment();
  return contractInstance;
}

main()
  .then(async (contractInstance) => {
    console.log("Contract deployed to:", contractInstance.target);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
