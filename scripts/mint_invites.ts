import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  console.log('deployer address:', account);
  const signer = accounts[0];
  // hardhat contract
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // '0x320d9D3356fdBC7F86b14d2F79E52576F7e9CbE3';
  // const invite = await ethers.getContractAt("Invite721", contractAddress, signer);
  const inviteContract = await ethers.getContractFactory("Invite721");

  const invite = inviteContract.attach(contractAddress);

  console.log(invite);

  // public mint
  const name = await invite.name();
  console.log(name);
  const tiersDisplay = await invite.getTiers();
  console.log(tiersDisplay);
  const numMints = [1, 0, 0, 0, 0, 0];

  // const totalPrice = parseEther("0.004");
  const addresses = ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
  // const tx = await soulbound.mint(to, numMints, { value: totalPrice });
  // await tx.wait();
  // const tx = await soulbound["mint(address,uint248[])"](to, numMints, { value: totalPrice });
  // const mintInterface = new ethers.utils.Interface([
  //   'function mint(address,uint248[])'
  // ]);
  // const multicallInterface = new ethers.utils.Interface([
  //   'function multicall(bytes[])'
  // ]);
  let bufferTx = [];
  for (const address of addresses) {
    // const mintData = mintInterface.encodeFunctionData(
    //   'mint', [address, numMints]
    // )
    const mintData = await invite.mint(address, numMints);
    bufferTx.push(mintData);
    if(bufferTx.length > 49) {
      const multiTx = await invite.multicall(bufferTx);
      await multiTx;
      console.log("multiTx hash:", multiTx.hash);
      bufferTx = [];
    }
  }
  

  console.log("Soulbound NFT deployed to:", invite.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});