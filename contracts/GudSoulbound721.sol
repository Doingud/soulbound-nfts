// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IGudSoulbound721.sol";
import "./Soulbound721Upgradable.sol";

import "hardhat/console.sol";

contract GudSoulbound721 is IGudSoulbound721, Soulbound721Upgradable, OwnableUpgradeable {
    using ECDSAUpgradeable for bytes32;

    error InvalidNumTiers();
    error InsufficientValue();
    error PublicMintingDisabled(uint256 tier);
    error ExceedsMaxOwnership(uint256 tier);
    error ExceedsMaxMerkleMintUses(uint256 tier);
    error ExceedsMaxSupply(uint256 tier);
    error NotOwner();
    error IncorrectOwnerSignature();
    error IncorrectMerkleProof();
    error WithdrawFailed();
    error NoSuchToken(uint256 tokenId);

    Tier[] private _tiers;
    mapping(uint256 => uint256) _numMinted;
    mapping(address /*owner*/ => mapping(uint256 /*tier*/ => uint256 /*numOwned*/)) private _numOwned;
    bytes32 private _mintMerkleRoot;
    bytes32 private _numMerkleRoots;
    mapping(address /*owner*/ => mapping(uint256 /*tier*/ => uint256 /*numOwned*/))[] private _merkleMintUses;

    function initialize(string memory name, string memory symbol, Tier[] memory tiers) external initializer {
        OwnableUpgradeable.__Ownable_init();
        Soulbound721Upgradable.__ERC721_init(name, symbol);
        setTiers(tiers);
    }

    function mint(address to, uint256[] calldata numMints) external payable {
        uint256 totalPrice = 0;
        for (uint i = 0; i < numMints.length; ++i) {
            if (numMints[i] != 0 && _tiers[i].publicPrice == type(uint256).max) {
                revert PublicMintingDisabled(i);
            }
            totalPrice += _tiers[i].publicPrice * numMints[i];
        }
        _mint(to, numMints, totalPrice);
    }

    function mint(
        uint256[] calldata numMints,
        MerkleMint calldata merkleMint,
        bytes32[] calldata merkleProof
    ) external payable {
        if (MerkleProofUpgradeable.verify(
            merkleProof,
            _mintMerkleRoot,
            keccak256(abi.encode(merkleMint.to, merkleMint.tierMaxMints,merkleMint.tierPrices))
        ) == false) {
            revert IncorrectMerkleProof();
        }
        mapping(uint256 => uint256) storage merkleMintUses = _merkleMintUses[_merkleMintUses.length - 1][merkleMint.to];
        uint256 totalPrice = 0;

        for (uint i = 0; i < numMints.length; ++i) {
            if (merkleMintUses[i] + numMints[i] > merkleMint.tierMaxMints[i]) {
                revert ExceedsMaxMerkleMintUses(i);
            }
            merkleMintUses[i] += numMints[i];

            totalPrice += merkleMint.tierPrices[i] * numMints[i];
        }
        _mint(merkleMint.to, numMints, totalPrice);

        emit MerkleMintUsed(merkleMint, numMints);
    }

    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != _msgSender()) {
            revert NotOwner();
        }
        _burn(tokenId);
        emit TokenBurned(tokenId);
    }

    function setTiers(Tier[] memory tiers) public onlyOwner {
        delete _tiers;

        if (tiers.length > type(uint8).max) {
            revert InvalidNumTiers();
        }

        for (uint i = 0; i < tiers.length; ++i) {
            _tiers.push(tiers[i]);
        }

        emit TiersSet(tiers);
    }

    function withdrawEther(address payable to, uint256 amount) external onlyOwner {
        (bool success, ) = to.call{value: amount}("");
        if (success == false) {
            revert WithdrawFailed();
        }
        emit EtherWithdrawn(to, amount);
    }

    function setMintMerkleRoot(bytes32 mintMerkleRoot) external onlyOwner {
        _mintMerkleRoot = mintMerkleRoot;
        _merkleMintUses.push();
        emit MintMerkleRootSet(mintMerkleRoot);
    }

    function getTiers() external view returns (Tier[] memory) {
        return _tiers;
    }

    function numMinted(uint256 tier) external view returns (uint256) {
        return _numMinted[tier];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(Soulbound721Upgradable, IERC721MetadataUpgradeable)
        returns (string memory)
    {
        if (ownerOf(tokenId) == address(0)) {
            revert NoSuchToken(tokenId);
        }
        return _tiers[tokenId >> 248].uri;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Soulbound721Upgradable, IERC165Upgradeable)
        returns (bool)
    {
            return interfaceId == type(IGudSoulbound721).interfaceId || super.supportsInterface(interfaceId);
    }

    function _mint(address to, uint256[] calldata numMints, uint256 totalPrice) private {
        for (uint tierNum = 0; tierNum < numMints.length; ++tierNum) {
            Tier storage tier = _tiers[tierNum];

            if (_numOwned[to][tierNum] + numMints[tierNum] > tier.maxOwnable) {
                revert ExceedsMaxOwnership(tierNum);
            }
            if (_numMinted[tierNum] + numMints[tierNum] > tier.maxSupply) {
                revert ExceedsMaxSupply(tierNum);
            }

            uint256 tokenId = (tierNum << 248) + _numMinted[tierNum];
            for (uint j = 0; j < numMints[tierNum]; ++j) {
                _safeMint(to, ++tokenId);
            }
            _numMinted[tierNum] += numMints[tierNum];
        }

        if (totalPrice > msg.value) {
            revert InsufficientValue();
        }
    }
}
