const { MerkleTree } = require("merkletreejs");
// const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const keccak256 = ethers.utils.keccak256;

let whitelistAddresses = [
  {
    to: "0x5c0085E600398247a37de389931CCea8EdD3ba67",
    tierMaxMints: [3, 2, 2, 1],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
  {
    to: "0xF8eD0348ce651f1DeFb19737ab7869F5039a5059",
    tierMaxMints: [3, 2, 2, 1],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
  {
    to: "0x66Dc3BFCD29E24fDDeE7f405c705220E6142e4cD",
    tierMaxMints: [3, 2, 2, 1],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
  {
    to: "0x6FdDa8792F91328007AebB0AB0ab83a5f1229D9B",
    tierMaxMints: [3, 2, 2, 1],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
];

// The leaves, merkleTree, and rootHash -> we have all prior to whitelist claim
const leafNodes = whitelistAddresses.map((merkleMint) =>
  keccak256(
    // ethers.utils.AbiCoder.prototype.encode(
    //   ['address', 'uint256[]', 'uint256[]'],
    //   [merkleMint.to, merkleMint.tierMaxMints, merkleMint.tierPrices]
    // )

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
  tierMaxMints: [3, 2, 2, 1],
  tierPrices: [100000000, 100000000, 100000000, 100000000],
};
// client-side
const claimingAddress = keccak256(
  ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256[]", "uint256[]"],
    [merkleMintInput.to, merkleMintInput.tierMaxMints, merkleMintInput.tierPrices]
  )
);

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

const contractAddress = "0x002aF40A6eB3C688612184C51500b97C1b89dfFC"; // with require msg
// '0x7Cb07737ddd71f0481B9E251b0593cA0bDCc2c64'; // Goerli (txn failed for merkle mint)
// rinkeby -> '0x320d9D3356fdBC7F86b14d2F79E52576F7e9CbE3'; (txn stuck)

const setMintMerkleRoot = async () => {
  const soulbound = await ethers.getContractAt("GudSoulbound721", contractAddress);
  const set_tx = await soulbound.setMintMerkleRoot(rootHash);
  await set_tx.wait();
  console.log("setMintMerkleRoot txn hash: ", set_tx.hash);

  const to = "0x5c0085E600398247a37de389931CCea8EdD3ba67",
    numMints = [1, 0, 2, 1];

  console.log("numMints in this txn: ", numMints);

  const totalPrice = "1000000000";

  const merkleMint = {
    to: "0x5c0085E600398247a37de389931CCea8EdD3ba67",
    tierMaxMints: [3, 2, 2, 1],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  };
  console.log("merkle mint allowance: ", merkleMint);

  const merkleProof = hexProof;
  // [
  //   "0xa07e89d048c1eb1c18b53940653fe0240fac2c6b8ebec6b480dad6b3c2aba611",
  //   "0xb973a6fc317f13ec872dd484b6d8a510106b21db69e0916c26935cf984e046a9",
  //   "0xd82345afce177fbd70593815c1766d38cb5c0c9f9c44180395cc1cb3284379df",
  // ];
  console.log("merkle proof to pass to contract: ", merkleProof);
  const tx = await soulbound["mint(address,uint256[],(address,uint256[],uint256[]),bytes32[])"](
    to,
    numMints,
    merkleMint,
    merkleProof,
    { value: totalPrice, gasLimit: "3000000" }
  );
  console.log("private mint pending txn:", tx.hash);
  await tx.wait();
  console.log("success private mint!!");
};

setMintMerkleRoot();
