const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('hardhat');

let whitelistAddresses = [
  {
    to: '0X5B38DA6A701C568545DCFCB03FCB875F56BEDDC4',
    tierMaxMints: [3, 4, 3, 7],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
  {
    to: '0X5A641E5FB72A2FD9137312E7694D42996D689D99',
    tierMaxMints: [3, 4, 3, 7],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
  {
    to: '0XDCAB482177A592E424D1C8318A464FC922E8DE40',
    tierMaxMints: [3, 4, 3, 7],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
  {
    to: '0x66Dc3BFCD29E24fDDeE7f405c705220E6142e4cD',
    tierMaxMints: [3, 4, 3, 7],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
  {
    to: '0XCC4C29997177253376528C05D3DF91CF2D69061A',
    tierMaxMints: [3, 4, 3, 7],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  },
];

// The leaves, merkleTree, and rootHash -> we have all prior to whitelist claim
const leafNodes = whitelistAddresses.map((merkleMint) => keccak256(JSON.stringify(merkleMint)));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

const rootHash = merkleTree.getRoot();
console.log('Whitelist Merkle Tree\n', merkleTree.toString());
console.log('Root Hash: ', rootHash);

// client-side
const claimingAddress = keccak256(
  JSON.stringify({
    to: '0x66Dc3BFCD29E24fDDeE7f405c705220E6142e4cD',
    tierMaxMints: [3, 4, 3, 7],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  })
);

// `getHexProof` returns the neighbour leaf and all parent nodes hashes that will
// be required to derive the Merkle Trees root hash.
const hexProof = merkleTree.getHexProof(claimingAddress);
console.log('hex proof for claiming address: ', hexProof);

// pass this hex proof to the _merkleProof[] required in the argument

// This would be implemented in your Solidity Smart Contract
console.log(
  'verify if whitelisted in js: ',
  merkleTree.verify(hexProof, claimingAddress, rootHash)
);

const contractAddress = '0x7Cb07737ddd71f0481B9E251b0593cA0bDCc2c64'; // Goerli (txn failed for merkle mint)
// rinkeby -> '0x320d9D3356fdBC7F86b14d2F79E52576F7e9CbE3'; (txn stuck)

const setMintMerkleRoot = async () => {
  const soulbound = await ethers.getContractAt('GudSoulbound721', contractAddress);
  // const set_tx = await soulbound.setMintMerkleRoot(rootHash);
  // await set_tx.wait();
  // console.log('setMintMerkleRoot txn hash: ', set_tx.hash);

  const to = '0x66Dc3BFCD29E24fDDeE7f405c705220E6142e4cD',
    numMints = [1, 0, 2, 1];

  console.log('numMints in this txn: ', numMints);

  const totalPrice = '1000000000';

  const merkleMint = {
    to: '0x66Dc3BFCD29E24fDDeE7f405c705220E6142e4cD',
    tierMaxMints: [3, 4, 3, 7],
    tierPrices: [100000000, 100000000, 100000000, 100000000],
  };
  console.log('merkle mint allowance: ', merkleMint);

  const merkleProof = hexProof;
  // [
  //   "0xa07e89d048c1eb1c18b53940653fe0240fac2c6b8ebec6b480dad6b3c2aba611",
  //   "0xb973a6fc317f13ec872dd484b6d8a510106b21db69e0916c26935cf984e046a9",
  //   "0xd82345afce177fbd70593815c1766d38cb5c0c9f9c44180395cc1cb3284379df",
  // ];
  console.log('merkle proof to pass to contract: ', merkleProof);
  const tx = await soulbound['mint(address,uint256[],(address,uint256[],uint256[]),bytes32[])'](
    to,
    numMints,
    merkleMint,
    merkleProof,
    { value: totalPrice, gasLimit: '10000000' }
  );
  console.log('private mint pending txn:', tx.hash);
  await tx.wait();
  console.log('success private mint!!');
};

setMintMerkleRoot();
