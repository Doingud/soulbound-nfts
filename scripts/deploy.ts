// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const gas = ethers.provider.getGasPrice();
  const soulboundContract = await ethers.getContractFactory("GudSoulbound721");
  const name = "GudSoulsv2",
    symbol = "GDS",
    tiers = [
      {
        publicPrice: parseEther("0.004"),
        maxSupply: "500",
        uri: "https://gateway.pinata.cloud/ipfs/QmavYWUp68dv5gqjrb5ueSp4BHgdsVHFKkZuDkyEMrQa7s",
        maxOwnable: "3",
      },
      {
        publicPrice: parseEther("0.004"),
        maxSupply: "500",
        uri: "https://gateway.pinata.cloud/ipfs/QmQz8Jh4EPceVb1uarUNCYv7WxR9Zw1eaATjDkF1wwaJJN",
        maxOwnable: "3",
      },
      {
        publicPrice: parseEther("0.004"),
        maxSupply: "500",
        uri: "https://gateway.pinata.cloud/ipfs/QmY8BaEx8xAiaHft6x8SHqHL4cYw2dKYWN22kpSX7oVDbc",
        maxOwnable: "3",
      },
      {
        publicPrice: parseEther("0.004"),
        maxSupply: "500",
        uri: "https://gateway.pinata.cloud/ipfs/QmZV53QZMAuyomT41LMPz5cWjpUn65VYtCtSER9chfVXmk",
        maxOwnable: "3",
      },
    ];
  // const soulbound = await soulboundContract.deploy(name, symbol, tiers);
  const soulbound = await upgrades.deployProxy(soulboundContract, [name, symbol, tiers]);

  await soulbound.deployed();

  console.log("Soulbound NFT deployed to:", soulbound.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// console.log(parseEther("0.004").toString());
// console.log(parseEther("0.0004").toString());

// [400000000000000, 300000000000000, 200000000000000, 100000000000000];
