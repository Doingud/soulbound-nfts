// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./IGudSoulbound721.sol";
import "./Soulbound721.sol";

contract GudSoulbound721 is IGudSoulbound721, Soulbound721, Ownable {
    using Address for address payable;
    using ECDSA for bytes32;

    error InvalidNumTiers();
    error InvalidMaxOwned(uint256 tier);
    error InsufficientValue();
    error PublicMintingDisabled(uint256 tier);
    error ExceedsMaxOwnership(uint256 tier);
    error NotOwner();
    error IncorrectOwnerSignature();
    error IncorrectMerkleProof();

    Tier[] private _tiers;
    mapping(uint256 => uint256) _numMinted;
    mapping(address /*owner*/ => mapping(uint256 /*tier*/ => uint256 /*numOwned*/)) private _numOwned;
    bytes32 private _mintMerkleRoot;

    constructor(string memory name, string memory symbol, Tier[] memory tiers) Soulbound721(name, symbol) {
        setTiers(tiers);
    }

    function mint(address to, uint256[] calldata numMints) external payable {
        for (uint i = 0; i < numMints.length; ++i) {
            if (numMints[i] != 0 && _tiers[i].publicPrice == type(uint256).max) {
                revert PublicMintingDisabled(i);
            }
        }
        _mint(to, numMints);
    }

    function mint(
        address to,
        uint256[] calldata numMints,
        MerkleMint calldata merkleMint,
        bytes32[] calldata merkleProof
    ) external payable {
        if (MerkleProof.verify(merkleProof, _mintMerkleRoot, keccak256(abi.encode(merkleMint))) == false) {
            revert IncorrectMerkleProof();
        }
        _mint(to, numMints);
    }

    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != _msgSender()) {
            revert NotOwner();
        }
        _burn(tokenId);
    }

    function setTiers(Tier[] memory tiers) public onlyOwner {
        delete _tiers;

        if (tiers.length > type(uint8).max) {
            revert InvalidNumTiers();
        }

        for (uint i = 0; i < tiers.length; ++i) {
            if (tiers[i].maxOwnable > type(uint248).max) {
                revert InvalidMaxOwned(i);
            }
            _tiers.push(tiers[i]);
        }
    }

    function withdrawEther(address payable to, uint256 amount) external onlyOwner {
        to.sendValue(amount);
    }

    function setMintMerkleRoot(bytes32 mintMerkleRoot) external onlyOwner {
        _mintMerkleRoot = mintMerkleRoot;
    }

    function getTiers() external view returns (Tier[] memory) {
        return _tiers;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view override(Soulbound721, IERC165) returns (bool) {
            return interfaceId == type(IGudSoulbound721).interfaceId || super.supportsInterface(interfaceId);
    }

    function _mint(address to, uint256[] calldata numMints) private {
        uint256 totalPrice = 0;

        for (uint tierNum = 0; tierNum < numMints.length; ++tierNum) {
            Tier storage tier = _tiers[tierNum];

            if (_numOwned[to][tierNum] + numMints[tierNum] > tier.maxOwnable) {
                revert ExceedsMaxOwnership(tierNum);
            }

            totalPrice += tier.publicPrice * numMints[tierNum];

            uint256 tokenId = (tierNum << 248) + _numMinted[tierNum] + 1;
            for (uint j = 0; j < numMints[tierNum]; ++j) {
                _safeMint(to, tokenId++);
            }
            _numMinted[tierNum] += numMints[tierNum];
        }

        if (totalPrice > msg.value) {
            revert InsufficientValue();
        }
    }
}
