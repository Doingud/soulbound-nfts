import { ethers } from 'hardhat';

async function main() {
  const contractAddress = '0x320d9D3356fdBC7F86b14d2F79E52576F7e9CbE3';
  const soulbound = await ethers.getContractAt('GudSoulbound721', contractAddress);

  const tiers = [
    {
      publicPrice: '2000000000000',
      maxOwnable: '5',
    },
    {
      publicPrice: '3000000000000',
      maxOwnable: '3',
    },
    {
      publicPrice: '1000000000000',
      maxOwnable: '2',
    },
    {
      publicPrice: '4000000000000',
      maxOwnable: '7',
    },
  ];
  // const tx = await soulbound.setTiers(tiers);
  // await tx.wait();
  // console.log("hash:", tx.hash);
  const tiersDisplay = await soulbound.getTiers();
  console.log(tiersDisplay);

  // const numMinted = await soulbound._numMinted(1);
  // console.log(numMinted);

  console.log('Soulbound NFT deployed to:', soulbound.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
