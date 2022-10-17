const { MerkleTree } = require("merkletreejs");
// const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const { default: axios } = require("axios");
const { parseEther } = require("ethers/lib/utils");
const keccak256 = ethers.utils.keccak256;

const contractAddress = "0x9501eE6a2c9EcBa60429995ae9FE1813587ebFaf";
const apiBaseUrl = "https://soulbound.kraznikunderverse.com";

const tierMaxMints = [3, 3, 3, 3];
const tierPrices = [
  parseEther("0.0004").toString(),
  parseEther("0.0003").toString(),
  parseEther("0.0002").toString(),
  parseEther("0.0001").toString(),
];

let whitelistAddresses = [];

const fetchWhitelists = async () => {
  const { data } = await axios({
    method: "get",
    url: `${apiBaseUrl}/whitelists`,
  });
  const whitelists = data?.data;
  for (let i = 0; i < whitelists.length; i++) {
    const obj = {
      to: whitelists[i].walletAddress,
      tierMaxMints: whitelists[i].tierMaxMints,
      tierPrices: whitelists[i].tierPrices,
    };
    whitelistAddresses.push(obj);
  }
  console.log(whitelistAddresses);
};

// The leaves, merkleTree, and rootHash -> we have all prior to whitelist claim
const merkleRootHash = async () => {
  const leafNodes = whitelistAddresses.map((merkleMint) =>
    keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256[]", "uint256[]"],
        [merkleMint.to, merkleMint.tierMaxMints, merkleMint.tierPrices]
      )
    )
  );
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sort: true });

  const rootHash = merkleTree.getRoot();
  console.log("Whitelist Merkle Tree\n", merkleTree.toString());
  console.log("Root Hash: ", rootHash);

  const merkleMintInput = {
    to: "0x5c0085E600398247a37de389931CCea8EdD3ba67",
    tierMaxMints,
    tierPrices,
  };

  console.log(merkleMintInput);
  // client-side
  const claimingAddress = keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256[]", "uint256[]"],
      [merkleMintInput.to, merkleMintInput.tierMaxMints, merkleMintInput.tierPrices]
    )
  );

  console.log("claiming address: ", claimingAddress);

  // `getHexProof` returns the neighbour leaf and all parent nodes hashes that will
  // be required to derive the Merkle Trees root hash.
  const hexProof = merkleTree.getHexProof(claimingAddress);
  console.log("hex proof for claiming address: ", hexProof);

  // pass this hex proof to the _merkleProof[] required in the argument

  // This would be implemented in your Solidity Smart Contract
  console.log(
    "verify if whitelisted in js: ",
    merkleTree.verify(hexProof, claimingAddress, rootHash)
  );

  return rootHash;
};

const setMintMerkleRoot = async (rootHash) => {
  const soulbound = await ethers.getContractAt("GudSoulbound721", contractAddress);
  const set_tx = await soulbound.setMintMerkleRoot(rootHash);
  await set_tx.wait();
  console.log("setMintMerkleRoot txn hash: ", set_tx.hash);

  return;

  const to = "0x5c0085E600398247a37de389931CCea8EdD3ba67",
    numMints = [1, 0, 2, 1];

  console.log("numMints in this txn: ", numMints);

  const totalPrice = "1000000000";

  const merkleMint = {
    to: "0x5c0085E600398247a37de389931CCea8EdD3ba67",
    tierMaxMints,
    tierPrices,
  };
  console.log("merkle mint allowance: ", merkleMint);

  const merkleProof = hexProof;

  console.log("merkle proof to pass to contract: ", merkleProof);
  const tx = await soulbound["mint(uint256[],(address,uint256[],uint256[]),bytes32[])"](
    numMints,
    merkleMint,
    merkleProof,
    { value: totalPrice, gasLimit: "3000000" }
  );
  console.log("private mint pending txn:", tx.hash);
  await tx.wait();
  console.log("success private mint!!");
};

const run = async () => {
  await fetchWhitelists();
  const rootHash = await merkleRootHash();
  await setMintMerkleRoot(rootHash);
};

run();
