// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IGudSoulboundNft.sol";

contract GudSoulboundNft is IGudSoulboundNft, ERC165, Ownable {
    event TokenMinted(uint256 tokenId, Token token);

    error TransferToNonErc721ReceiverImplementer(address to);
    error ZeroAddressOwner();
    error InvalidTokenId(uint256 tokenId);
    error TransferringTokensNotAllowed();
    error Erc20TransferFailed(IERC20 erc20Contract, address from, address to, uint256 amount);
    error EtherTransferFailed(address from, address to, uint256 amount);
    error Erc20NotApproved(IERC20 erc20Contract);
    error NotOwner(uint256 tokenId);

    struct Token {
        uint256 mintAmount;
        address mintCurrency;
        address owner;
    }

    address private constant ETHER_MINT_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    string private _name;
    string private _symbol;
    mapping(uint256 => Token) private _tokens;
    mapping(address => uint256) private _balances;
    uint256 _numTokens;
    mapping(IERC20 => bool) _erc20Approvals;

    function initialize(string memory name, string memory symbol) external onlyOwner {
        _name = name;
        _symbol = symbol;
    }

    receive() external payable {
        mint();
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        return "";
    }

    function setErc20Approvals(IERC20[] calldata erc20Contracts, bool[] calldata approval) external onlyOwner {
        for (uint i = 0; i < erc20Contracts.length; ++i) {
            _erc20Approvals[erc20Contracts[i]] = approval[i];
        }
    }

    function balanceOf(address owner) external view returns (uint256 balance) {
        if (owner == address(0)) {
            revert ZeroAddressOwner();
        }
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view returns (address owner) {
        owner = _tokens[tokenId].owner;
        if (owner == address(0)) {
            revert InvalidTokenId(tokenId);
        }
    }

    function safeTransferFrom(
        address /*from*/,
        address /*to*/,
        uint256 /*tokenId*/,
        bytes calldata /*data*/
    ) external pure {
        revert TransferringTokensNotAllowed();
    }

    function safeTransferFrom(
        address /*from*/,
        address /*to*/,
        uint256 /*tokenId*/
    ) external pure {
        revert TransferringTokensNotAllowed();
    }

    function transferFrom(
        address /*from*/,
        address /*to*/,
        uint256 /*tokenId*/
    ) external pure {
        revert TransferringTokensNotAllowed();
    }

    function approve(address /*to*/, uint256 /*tokenId*/) external pure {
        revert TransferringTokensNotAllowed();
    }

    function setApprovalForAll(address /*operator*/, bool /*_approved*/) external pure {
        revert TransferringTokensNotAllowed();
    }

    function getApproved(uint256 tokenId) external view returns (address operator) {
        if (tokenId >= _numTokens) {
            revert InvalidTokenId(tokenId);
        }
        return address(0);
    }

    function isApprovedForAll(address /*owner*/, address /*operator*/) external pure returns (bool) {
        return false;
    }

    function mint(IERC20 erc20Contract, uint256 erc20Amount) public {
        if (_erc20Approvals[erc20Contract] == false) {
            revert Erc20NotApproved(erc20Contract);
        }
        if (erc20Contract.transferFrom(msg.sender, address(this), erc20Amount) == false) {
            revert Erc20TransferFailed(erc20Contract, msg.sender, address(this), erc20Amount);
        }

        _mint(address(erc20Contract), erc20Amount);
    }

    function mintWithPermit(
        IERC20Permit erc20Contract,
        uint256 erc20Amount,
        PaymentPermit calldata paymentPermit
    ) external {
        erc20Contract.permit(
            msg.sender,
            address(this),
            paymentPermit.amount,
            paymentPermit.deadline,
            paymentPermit.v,
            paymentPermit.r,
            paymentPermit.s
        );

        mint(IERC20(address(erc20Contract)), erc20Amount);
    }

    function mint() public payable {
        _mint(ETHER_MINT_ADDRESS, msg.value);
    }

    function burn(uint256 tokenId) external {
        if (_tokens[tokenId].owner != msg.sender) {
            revert NotOwner(tokenId);
        }
        delete _tokens[tokenId];

        emit Transfer(msg.sender, address(0), tokenId);
    }

    function withdrawErc20s(IERC20[] calldata erc20Contracts, address to) external onlyOwner {
        for (uint i = 0; i < erc20Contracts.length; ++i) {
            uint256 amount = erc20Contracts[i].balanceOf(address(this));
            if (erc20Contracts[i].transfer(to, amount) == false) {
                revert Erc20TransferFailed(erc20Contracts[i], address(this), to, amount);
            }
        }
    }

    function withdrawEther(address to) external onlyOwner {
        (bool sent, /*bytes memory data*/) = to.call{value: address(this).balance}("");
        if (sent == false) {
            revert EtherTransferFailed(address(this), to, address(this).balance);
        }
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IGudSoulboundNft).interfaceId || super.supportsInterface(interfaceId);
    }

    function _mint(address mintCurrency, uint256 erc20Amount) private {
        uint256 tokenId = ++_numTokens;
        Token memory token = Token(erc20Amount, mintCurrency, msg.sender);

        _balances[msg.sender] += 1;
        _tokens[tokenId] = token;

        if (_checkOnERC721Received(address(0), msg.sender, tokenId, "") == false) {
            revert TransferToNonErc721ReceiverImplementer(msg.sender);
        }

        emit TokenMinted(tokenId, token);
        emit Transfer(address(0), msg.sender, tokenId);
    }

    /**
     * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
     * The call is not executed if the target address is not a contract.
     *
     * @param from address representing the previous owner of the given token ID
     * @param to target address that will receive the tokens
     * @param tokenId uint256 ID of the token to be transferred
     * @param data bytes optional data to send along with the call
     * @return bool whether the call correctly returned the expected magic value
     */
    // noinspection NoReturn
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert TransferToNonErc721ReceiverImplementer(to);
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
}