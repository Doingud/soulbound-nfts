// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";

import "./IInvite721.sol";

contract Invite721 is IInvite721, ERC721Upgradeable, OwnableUpgradeable, Multicall {
    // using ECDSAUpgradeable for bytes32;

    error InvalidNumTiers();
    error InsufficientValue();
    // error PublicMintingDisabled(uint8 tier);
    error ExceedsMaxOwnership(uint8 tier);
    // error ExceedsMaxMerkleMintUses(uint8 tier);
    error ExceedsMaxSupply(uint8 tier);
    error NotOwner();
    error IncorrectOwnerSignature();
    // error IncorrectMerkleProof();
    error WithdrawFailed();
    error NoSuchToken(uint256 tokenId);

    Tier[] private _tiers;
    mapping(uint8 /*tier*/ => uint248 /*numMinted*/) _numMinted; // need to be private ?
    mapping(address /*owner*/ => mapping(uint8 /*tier*/ => uint248 /*numOwned*/)) private _numOwned;
    // bytes32 private _mintMerkleRoot;
    // bytes32 private _numMerkleRoots;
    // mapping(address /*owner*/ => mapping(uint8 /*tier*/ => uint248 /*numMinted*/))[] private _merkleMintUses;

    function initialize(string memory name, string memory symbol, Tier[] memory tiers) external initializer {
        OwnableUpgradeable.__Ownable_init();
        ERC721Upgradeable.__ERC721_init(name, symbol);
        setTiers(tiers);
    }

    function mint(address to, uint248[] calldata numMints) external onlyOwner {
        _mint(to, numMints);
    }

    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != _msgSender()) {
            revert NotOwner();
        }
        _burn(tokenId);
        _numOwned[msg.sender][uint8(tokenId >> 248)] -= 1;
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

    // function setMintMerkleRoot(bytes32 mintMerkleRoot) external onlyOwner {
    //     _mintMerkleRoot = mintMerkleRoot;
    //     _merkleMintUses.push();
    //     emit MintMerkleRootSet(mintMerkleRoot);
    // }

    function getTiers() external view returns (Tier[] memory) {
        return _tiers;
    }

    function numMinted(uint8 tier) external view returns (uint248) {
        return _numMinted[tier];
    }

    function numOwned(address owner, uint8 tier) external view returns (uint248) {
        return _numOwned[owner][tier];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, IERC165Upgradeable)
        returns (bool)
    {
            return interfaceId == type(IInvite721).interfaceId || super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(IERC721MetadataUpgradeable, ERC721Upgradeable)
        returns (string memory)
    {
        if (ownerOf(tokenId) == address(0)) {
            revert NoSuchToken(tokenId);
        }
        Tier storage tier = _tiers[tokenId >> 248];
        if (tier.idInUri) {
            return string.concat("ipfs://", tier.cid, "/", Strings.toString(uint248(tokenId)), ".json");
        } else {
            return string.concat("ipfs://", tier.cid, "/metadata.json");
        }
    }

    function _mint(address to, uint248[] calldata numMints) private {
        for (uint tierNum = 0; tierNum < numMints.length; ++tierNum) {
            Tier storage tier = _tiers[tierNum];

            if (_numOwned[to][uint8(tierNum)] + numMints[tierNum] > tier.maxOwnable) {
                revert ExceedsMaxOwnership(uint8(tierNum));
            }
            if (_numMinted[uint8(tierNum)] + numMints[tierNum] > tier.maxSupply) {
                revert ExceedsMaxSupply(uint8(tierNum));
            }

            uint256 tokenId = (tierNum << 248) + _numMinted[uint8(tierNum)];
            for (uint j = 0; j < numMints[tierNum]; ++j) {
                _safeMint(to, ++tokenId);
            }
            _numOwned[to][uint8(tierNum)] += numMints[uint8(tierNum)];
            _numMinted[uint8(tierNum)] += numMints[uint8(tierNum)];
        }
    }
}
