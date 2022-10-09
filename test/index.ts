import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { GudSoulbound721 } from '../typechain';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import keccak256 from 'keccak256';
import { MerkleTree } from 'merkletreejs';

describe('Test', function() {
  let accounts: SignerWithAddress[];
  let soulBoundContract: GudSoulbound721;
  let tiers: {
    publicPrice: BigNumber;
    maxOwnable: BigNumber;
    maxSupply: BigNumber;
    uri: string;
  }[];

  before(async () => {
    accounts = await ethers.getSigners();

    tiers = [
      {
        publicPrice: ethers.constants.MaxUint256,
        maxOwnable: BigNumber.from(2),
        maxSupply: BigNumber.from(1000),
        uri: 'ipfs://1234',
      },
      {
        publicPrice: ethers.constants.MaxUint256,
        maxOwnable: BigNumber.from(4),
        maxSupply: BigNumber.from(1000),
        uri: 'ipfs://4567',
      },
    ];

    const soulbound721Factory = await ethers.getContractFactory('GudSoulbound721');
    soulBoundContract = await upgrades.deployProxy(
      soulbound721Factory,
      ['Foo', 'FOO', tiers],
    ) as GudSoulbound721;
    await soulBoundContract.deployed();
  });

  it('Test retrieving tiers', async () => {
    const solTiers = await soulBoundContract.getTiers();
    expect(solTiers.length).equal(tiers.length);
    for (let i = 0; i < tiers.length; ++i) {
      expect(tiers[i].publicPrice).equal(solTiers[i].publicPrice);
      expect(tiers[i].maxOwnable).equal(solTiers[i].maxOwnable);
      expect(tiers[i].maxSupply).equal(solTiers[i].maxSupply);
      expect(tiers[i].uri).equal(solTiers[i].uri);
    }
  });

  it('Test retrieving and changing ownership', async () => {
    expect(await soulBoundContract.owner()).equal(accounts[0].address);
    await soulBoundContract.transferOwnership(accounts[1].address);
    expect(await soulBoundContract.owner()).equal(accounts[1].address);
    await soulBoundContract.connect(accounts[1]).transferOwnership(accounts[0].address);
    expect(await soulBoundContract.owner()).equal(accounts[0].address);
  });

  it('Test Merkle minting', async () => {
    const tierPrices1 = [500, 5_000];
    const tierPrices2 = [500, 10_000];
    const mints: { to: string; tierMaxMints: number[]; tierPrices: number[] }[] = [
      { to: accounts[1].address, tierMaxMints: [2, 1], tierPrices: tierPrices1 },
      { to: accounts[2].address, tierMaxMints: [1, 2], tierPrices: tierPrices2 },
    ];
    const leaves: Buffer[] = mints.map(mint => keccak256(ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint256[]', 'uint256[]'],
      [mint.to, mint.tierMaxMints, mint.tierPrices],
    )));
    const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

    await soulBoundContract.setMintMerkleRoot(merkleTree.getHexRoot());

    let balance: BigNumber;
    let newBalance;

    await expect(soulBoundContract['mint(uint248[],(address,uint248[],uint256[]),bytes32[])'](
      [mints[0].tierMaxMints[0] + 1, 1],
      mints[0],
      merkleTree.getHexProof(leaves[0]),
    )).revertedWith('ExceedsMaxMerkleMintUses(0)');

    balance = await ethers.provider.getBalance(soulBoundContract.address);
    await soulBoundContract['mint(uint248[],(address,uint248[],uint256[]),bytes32[])'](
      [2, 1],
      mints[0],
      merkleTree.getHexProof(leaves[0]),
      { value: 2 * tierPrices1[0] + tierPrices1[1] },
    );
    await expect(soulBoundContract['mint(uint248[],(address,uint248[],uint256[]),bytes32[])'](
      [2, 1],
      mints[0],
      merkleTree.getHexProof(leaves[0]),
      { value: 2 * 500 + 5000 },
    )).revertedWith('ExceedsMaxMerkleMintUses(0)');
    expect(await soulBoundContract.ownerOf(BigNumber.from(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    ))).equal(mints[0].to);
    expect(await soulBoundContract.ownerOf(BigNumber.from(
      '0x0000000000000000000000000000000000000000000000000000000000000002',
    ))).equal(mints[0].to);
    expect(await soulBoundContract.ownerOf(BigNumber.from(
      '0x0100000000000000000000000000000000000000000000000000000000000001',
    ))).equal(mints[0].to);
    newBalance = await ethers.provider.getBalance(soulBoundContract.address);
    expect(newBalance.sub(balance)).equal(2 * tierPrices1[0] + tierPrices1[1]);
    balance = newBalance;

    await soulBoundContract['mint(uint248[],(address,uint248[],uint256[]),bytes32[])'](
      [0, 1],
      mints[1],
      merkleTree.getHexProof(leaves[1]),
      { value: tierPrices2[1] },
    );
    await soulBoundContract['mint(uint248[],(address,uint248[],uint256[]),bytes32[])'](
      [0, 1],
      mints[1],
      merkleTree.getHexProof(leaves[1]),
      { value: tierPrices2[1] },
    );
    await expect(soulBoundContract['mint(uint248[],(address,uint248[],uint256[]),bytes32[])'](
      [0, 1],
      mints[1],
      merkleTree.getHexProof(leaves[1]),
      { value: tierPrices2[1] },
    )).revertedWith('ExceedsMaxMerkleMintUses(1)');

    await expect(soulBoundContract['mint(uint248[],(address,uint248[],uint256[]),bytes32[])'](
      [1, 0],
      mints[1],
      merkleTree.getHexProof(leaves[1]),
      { value: mints[1].tierPrices[0] - 1 },
    )).revertedWith('InsufficientValue()');
    expect(await soulBoundContract.ownerOf(BigNumber.from(
      '0x0100000000000000000000000000000000000000000000000000000000000002',
    ))).equal(mints[1].to);
    expect(await soulBoundContract.ownerOf(BigNumber.from(
      '0x0100000000000000000000000000000000000000000000000000000000000003',
    ))).equal(mints[1].to);
    newBalance = await ethers.provider.getBalance(soulBoundContract.address);
    expect(newBalance.sub(balance)).equal(2 * tierPrices2[1]);
  });

  it('Test public minting', async () => {
    await expect(soulBoundContract['mint(address,uint248[])'](
      accounts[3].address,
      [1],
    )).revertedWith('PublicMintingDisabled(0)');

    tiers[0].publicPrice = BigNumber.from(20_000);
    tiers[1].publicPrice = BigNumber.from(40_000);
    await soulBoundContract.setTiers(tiers);

    const lastTokenIds = [
      await soulBoundContract.numMinted(0),
      BigNumber.from(1).shl(248).add(await soulBoundContract.numMinted(1)),
    ];

    const balance = await ethers.provider.getBalance(soulBoundContract.address);
    await expect(soulBoundContract['mint(address,uint248[])'](
      accounts[3].address,
      [0, tiers[1].maxOwnable],
      { value: 2 * tiers[1].publicPrice.toNumber() - 1 },
    )).revertedWith('InsufficientValue()');
    await soulBoundContract['mint(address,uint248[])'](
      accounts[3].address,
      [0, 2],
      { value: 2 * tiers[1].publicPrice.toNumber() },
    );
    expect(await soulBoundContract.ownerOf(lastTokenIds[1].add(1))).equal(accounts[3].address);
    expect(await soulBoundContract.ownerOf(lastTokenIds[1].add(2))).equal(accounts[3].address);
    const newBalance = await ethers.provider.getBalance(soulBoundContract.address);
    expect(newBalance.sub(balance)).equal(2 * tiers[1].publicPrice.toNumber());

    await soulBoundContract['mint(address,uint248[])'](
      accounts[4].address,
      [tiers[0].maxOwnable],
      { value: tiers[0].maxOwnable.mul(tiers[0].publicPrice) }
    );
    await expect(soulBoundContract['mint(address,uint248[])'](
      accounts[4].address,
      [1],
      { value: tiers[0].publicPrice }
    )).revertedWith('ExceedsMaxOwnership(0)');
  });

   it('Test burning', async () => {
    await soulBoundContract['mint(address,uint248[])'](
      accounts[5].address,
      [2],
      { value: tiers[0].publicPrice.toNumber() * 2 }
    );
    const secondToken = await soulBoundContract.numMinted(0);
    expect(await soulBoundContract.ownerOf(secondToken.sub(1))).equal(accounts[5].address);
    expect(await soulBoundContract.ownerOf(secondToken)).equal(accounts[5].address);

    await soulBoundContract.connect(accounts[5]).burn(secondToken.sub(1));
    await expect(
      soulBoundContract.ownerOf(secondToken.sub(1))
    ).revertedWith('ERC721: invalid token ID" [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="ownerOf(uint256)');
    expect(await soulBoundContract.ownerOf(secondToken)).equal(accounts[5].address);
  });

  it('Test withdrawing ether', async () => {
    const contractBalance = await ethers.provider.getBalance(soulBoundContract.address);
    await expect(
      soulBoundContract.connect(accounts[1]).withdrawEther(accounts[1].address, contractBalance)
    ).revertedWith('Ownable: caller is not the owner');

    const recipientBalance = await accounts[1].getBalance();
    await soulBoundContract.withdrawEther(accounts[1].address, contractBalance);
    const newContractBalance = await ethers.provider.getBalance(soulBoundContract.address);
    const newRecipientBalance = await accounts[1].getBalance();
    expect(contractBalance.sub(newContractBalance)).equal(contractBalance);
    expect(newRecipientBalance.sub(recipientBalance)).equal(contractBalance);
  });
});
