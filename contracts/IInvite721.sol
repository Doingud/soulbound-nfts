// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol";

interface IInvite721 is IERC721MetadataUpgradeable {
    event TokenBurned(uint256 tokenId);
    event TiersSet(Tier[] tiers);
    event EtherWithdrawn(address payable to, uint256 amount);

    /**
     * @dev describes a token tier
     *
     * @param publicPrice describes the publicly available minting price; a value of type(uint256).max means
     * public minting is unavailable for this tier
     * @param maxOwnable maximum tokens of this tier that can be owned by any one address
     * @param maxSupply maximum tokens of this tier than can be minted
     * @param uri URI for this tier
    */
    struct Tier {
        string cid;
        bool idInUri;
        uint248 maxSupply;
        uint248 maxOwnable;
    }

    function initialize(string memory name, string memory symbol, Tier[] memory tiers) external;

    /**
     * @dev public minting function
     *
     * @param to token recipient address
     * @param numMints number of tokens of each tier to mint
    */
    function mint(address to, uint248[] calldata numMints) external /*onlyOwner*/;

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
     * @return Tier description of each tier
    */
    function getTiers() external view returns (Tier[] memory);

    /**
    * @return number of tokens minted in `tier`
    */
    function numMinted(uint8 tier) external view returns (uint248);

    /**
    * @return number of tokens owned by `owner` in `tier`
    */
    function numOwned(address owner, uint8 tier) external view returns (uint248);
}