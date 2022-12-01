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
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  console.log('deployer address:', account);
  const signer = accounts[0];
  // We get the contract to deploy
  const inviteContract = await ethers.getContractFactory('Invite721', signer);
  console.log('contract factory', inviteContract);
  const name = 'GudSoul Invite Ticket';
    const symbol = 'GIT'; // ??
    const tiers = [
      // CultDAO
      {
        maxOwnable: 1,
        maxSupply: 1000,
        idInUri: false,
        cid: 'ipfs://1234',
      },
      // Gitcoin
      {
        maxOwnable: 1,
        maxSupply: 1000,
        idInUri: false,
        cid: 'ipfs://1234',
      },
      // Giveth
      {
        maxOwnable: 1,
        maxSupply: 1000,
        idInUri: false,
        cid: 'ipfs://1234',
      },
      // Livepeer
      {
        maxOwnable: 1,
        maxSupply: 1000,
        idInUri: false,
        cid: 'ipfs://1234',
      },
      // ShapeShift
      {
        maxOwnable: 1,
        maxSupply: 1000,
        idInUri: false,
        cid: 'ipfs://1234',
      },
      // SporkDAO
      {
        maxOwnable: 1,
        maxSupply: 1000,
        idInUri: false,
        cid: 'ipfs://1234',
      },
    ];
  const invite = await upgrades.deployProxy(
    inviteContract,
    [name, symbol, tiers],
    { unsafeAllow: ['delegatecall'] }
  );
  console.log('invite contract', invite);
  await invite.deployed();

  const tiersDisplay = await invite.getTiers();
  console.log('tiers', tiersDisplay);
  console.log('Invites NFT deployed to:', invite.address);
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
