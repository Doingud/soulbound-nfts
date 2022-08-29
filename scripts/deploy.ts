// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from 'hardhat';

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const soulboundContract = await ethers.getContractFactory('GudSoulbound721');
  const name = 'GudSoulsv1';
    const symbol = 'GDS';
    const tiers = [
      {
        publicPrice: 2000000000000,
        maxOwnable: 5,
        maxSupply: 1000,
        uri: 'ipfs://1234',
      },
      {
        publicPrice: 3000000000000,
        maxOwnable: 3,
        maxSupply: 1000,
        uri: 'ipfs://1234',
      },
      {
        publicPrice: 1000000000000,
        maxOwnable: 2,
        maxSupply: 1000,
        uri: 'ipfs://1234',
      },
      {
        publicPrice: 4000000000000,
        maxOwnable: 7,
        maxSupply: 1000,
        uri: 'ipfs://1234',
      },
    ];
  const soulbound = await upgrades.deployProxy(
    soulboundContract,
    [name, symbol, tiers],
  );

  await soulbound.deployed();

  console.log('Soulbound NFT deployed to:', soulbound.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// 0xe84Fb7241D82a6fafC169835C739A97D0Cf68512 (Goerli)
// 0x3A22b0B805EbeCdd5a4A66352979A505fe1348D0 (Mumbai)
// npx hardhat verify --network goerli --constructor-args arguments.js 0xe84Fb7241D82a6fafC169835C739A97D0Cf68512
// 0x320d9D3356fdBC7F86b14d2F79E52576F7e9CbE3 (Rinkeby)
