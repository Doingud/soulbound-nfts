// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";

interface IGudSoulboundNft is IERC721, IERC721Metadata {
    struct PaymentPermit {
        uint256 amount;
        uint256 deadline;
        bytes32 r;
        bytes32 s;
        uint8 v;
    }

    function mint(IERC20 erc20Contract, uint256 erc20Amount) external;
    function mintWithPermit(
        IERC20Permit erc20Contract,
        uint256 erc20Amount,
        PaymentPermit calldata paymentPermit
    ) external;
    function mint() external payable;
    function burn(uint256 tokenId) external;
}