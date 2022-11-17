// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers, upgrades} from 'hardhat';

async function main() {
  const soulboundContractAddress = '0x7E26C681DB1D374293ED05e22Fc88B4769F193ac';
  console.log(`Implementation is at: ${await upgrades.erc1967.getImplementationAddress(soulboundContractAddress)}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
