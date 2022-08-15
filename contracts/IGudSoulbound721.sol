// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";

interface IGudSoulbound721 is IERC721, IERC721Metadata {
    event MintMerkleRootSet(bytes32 mintMerkleRoot);

    /**
     * @dev describes a token tier
     *
     * @param publicPrice describes the publicly available minting price; a value of type(uint256).max means
     * public minting is unavailable for this tier
     * @param maxOwnable maximum tokens of this tier that can be owned by any one address
    */
    struct Tier {
        uint256 publicPrice;
        uint256 maxOwnable;
    }

    /**
     * @dev describes a private mint offer for one recipient address; a leaf of the mintMerkle tree
     *
     * @param token recipient address
     * @param tierMaxMints number of times this offer can be used for each tier
     * @param price of this offer for each tier
    */
    struct MerkleMint {
        address to;
        uint256[] tierMaxMints;
        uint256[] tierPrices;
    }

    /**
     * @dev public minting function
     *
     * @param to token recipient address
     * @param numMints number of tokens of each tier to mint
    */
    function mint(address to, uint256[] calldata numMints) external payable;

    /**
    * @dev private minting function
    *
    * @param to token recipient address
    * @param numMints number of tokens of each tier to mint
    * @param merkleMint the relevant MerkleMint leaf of the mintMerkle tree
    * @param merkleProof Merkle proof for the leaf
    */
    function mint(
        address to,
        uint256[] calldata numMints,
        MerkleMint calldata merkleMint,
        bytes32[] calldata merkleProof
    ) external payable;

    /**
     * @dev burns an NFT held by the sender
    */
    function burn(uint256 tokenId) external;

    /**
     * @dev tiers Sets all token tiers. A maximum of 256 tiers are allowed.
    */
    function setTiers(Tier[] calldata tiers) external /*onlyOwner*/;

    /**
     * @dev allows the contract owner to withdraw contract funds
     *
     * @param to Ether recipient
     * @param amount amount of Ether to withdraw
    */
    function withdrawEther(address payable to, uint256 amount) external /*onlyOwner*/;

    /**
     * @dev Sets the Merkle root of the tree describing all current private mint offers. Each leaf is the encoded hash
     * of a MerkleMint.
    */
    function setMintMerkleRoot(bytes32 mintMerkleRoot) external /*onlyOwner*/;

    /**
     * @return Tier description of each tier
    */
    function getTiers() external view returns (Tier[] memory);
}