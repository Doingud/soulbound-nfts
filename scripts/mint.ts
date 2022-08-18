import { ethers } from 'hardhat';

async function main() {
  const contractAddress = '0xe84Fb7241D82a6fafC169835C739A97D0Cf68512';
  const soulbound = await ethers.getContractAt('GudSoulbound721', contractAddress);

  // console.log(soulbound)

  // public mint
  const to = '0x66Dc3BFCD29E24fDDeE7f405c705220E6142e4cD',
    numMints = [0, 1, 2];

  const totalPrice = '30000000000';

  // const tx = await soulbound.mint(to, numMints, { value: totalPrice });
  // await tx.wait();
  const tx = await soulbound['mint(address,uint256[])'](to, numMints, { value: totalPrice });
  await tx.wait();
  console.log('hash:', tx.hash);
  const tiersDisplay = await soulbound.getTiers();
  // console.log(tiersDisplay);

  console.log('Soulbound NFT deployed to:', soulbound.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
