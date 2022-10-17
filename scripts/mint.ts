import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x5Eb9c35A94e8C488b51e0EDE6818F6B126a86c99"; // '0x320d9D3356fdBC7F86b14d2F79E52576F7e9CbE3';
  const soulbound = await ethers.getContractAt("GudSoulbound721", contractAddress);

  // console.log(soulbound)

  // public mint
  const to = "0x66Dc3BFCD29E24fDDeE7f405c705220E6142e4cD",
    numMints = [1, 0, 0, 0];

  const totalPrice = parseEther("0.001");

  // const tx = await soulbound.mint(to, numMints, { value: totalPrice });
  // await tx.wait();
  const tx = await soulbound["mint(address,uint248[])"](to, numMints, { value: totalPrice });
  await tx.wait();
  console.log("hash:", tx.hash);
  const tiersDisplay = await soulbound.getTiers();
  // console.log(tiersDisplay);

  console.log("Soulbound NFT deployed to:", soulbound.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
