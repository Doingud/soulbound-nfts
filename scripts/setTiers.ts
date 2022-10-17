import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x9501eE6a2c9EcBa60429995ae9FE1813587ebFaf";
  const soulbound = await ethers.getContractAt("GudSoulbound721", contractAddress);

  const tiers = [
    {
      publicPrice: parseEther("0.004"),
      maxSupply: "500",
      uri: "https://gateway.pinata.cloud/ipfs/QmThTPcWDL49GWejW4eHa7RZq4LhnfFUzQ3wgjHKSTxnkp/Angel.json",
      maxOwnable: "3",
    },
    {
      publicPrice: parseEther("0.003"),
      maxSupply: "500",
      uri: "https://gateway.pinata.cloud/ipfs/QmThTPcWDL49GWejW4eHa7RZq4LhnfFUzQ3wgjHKSTxnkp/Heart.json",
      maxOwnable: "3",
    },
    {
      publicPrice: parseEther("0.002"),
      maxSupply: "500",
      uri: "https://gateway.pinata.cloud/ipfs/QmThTPcWDL49GWejW4eHa7RZq4LhnfFUzQ3wgjHKSTxnkp/Seed.json",
      maxOwnable: "3",
    },
    {
      publicPrice: parseEther("0.001"),
      maxSupply: "500",
      uri: "https://gateway.pinata.cloud/ipfs/QmThTPcWDL49GWejW4eHa7RZq4LhnfFUzQ3wgjHKSTxnkp/Nucleus.json",
      maxOwnable: "3",
    },
  ];
  const tx = await soulbound.setTiers(tiers);
  await tx.wait();
  console.log("hash:", tx.hash);
  const tiersDisplay = await soulbound.getTiers();
  console.log(tiersDisplay);

  // const numMinted = await soulbound._numMinted(1);
  // console.log(numMinted);

  console.log("Soulbound NFT deployed to:", soulbound.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
