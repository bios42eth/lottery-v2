// SPDX-License-Identifier: UNLICENCED

pragma solidity ^0.8.7;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/finance/PaymentSplitter.sol';

import '@openzeppelin/contracts/access/Ownable.sol';

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/utils/Address.sol';

contract MyERC721 is ERC721Enumerable, PaymentSplitter, Ownable {

  bool public isWhitelistMintingOpened;
  bool public isPublicMintingOpened;

  uint16 public MAXCOLLECTIONSIZE = 10000;
  uint16 public batchMintLimit = 20;

  address public whiteListSigner;
  string public baseURI;

  event WhitelistMintFlipped(bool wlMint);
  event PublicMintFlipped(bool publicMint);
  event WhiteListSignerUpdated(address signer);
  event BaseURIUpdated(string newURI);
  event BatchMintLimitUpdated(uint16 newLimit);

  constructor(
    address _whiteListSigner,
    address owner,
    address[] memory payees,
    uint256[] memory shares,
    string memory _uri)
    ERC721("My ERC721","MYERC721")
    PaymentSplitter(payees, shares)
    {
      require(owner != address(0), "Please provide a valid owner");
      require(_whiteListSigner != address(0), "Please provide a valid whitelist signer");
      whiteListSigner = _whiteListSigner;
      baseURI = _uri;
      transferOwnership(owner);
  }

  //
  // Public Access
  //

  function price() public view returns (uint256) {
    uint256 slice = totalSupply() / 100;
    return (30 + 2 * slice) * 10**15;
  }

  function mint(uint16 count) external payable {
    require(msg.value >= count * price(),"Insufficiant amount sent");
    require(isPublicMintingOpened, "Public minting is closed");

    _batchMint(msg.sender, count);
  }

  function wlMint(uint16 count, bytes memory signedMessage) external payable {
    require(msg.value >= count * price(),"Insufficiant amount sent");
    require(isWhitelistMintingOpened, "Whitelist minting is closed");
    require(getSigner(signedMessage) == whiteListSigner, "Address not approved");

    _batchMint(msg.sender, count);
  }

  function tokensOfOwner(address owner) external view returns (uint256[] memory) {
    uint256 tokenCount = balanceOf(owner);
    uint256[] memory result = new uint256[](tokenCount);
    for (uint256 index; index < tokenCount; index++) {
        result[index] = tokenOfOwnerByIndex(owner, index);
    }
    return result;
  }

  //
  // Owner Access
  //

  function flipWhiteListMint() external onlyOwner{
    isWhitelistMintingOpened = !isWhitelistMintingOpened;
    emit WhitelistMintFlipped(isWhitelistMintingOpened);
  }

  function flipPublicMint() external onlyOwner {
    isPublicMintingOpened = !isPublicMintingOpened;
    emit PublicMintFlipped(isPublicMintingOpened);
  }

  function updateWhitelistSigner(address newAddress) external onlyOwner {
    whiteListSigner = newAddress;
    emit WhiteListSignerUpdated(newAddress);
  }

  function updateBatchMintLimit(uint16 newLimit) external onlyOwner {
    batchMintLimit = newLimit;
    emit BatchMintLimitUpdated(newLimit);
  }

  function setBaseURI(string calldata _newBaseURI) external onlyOwner {
    baseURI = _newBaseURI;
    emit BaseURIUpdated(_newBaseURI);
  }

  //
  // Internal functions
  //

  function _batchMint(address to,uint16 count) private {
    require(totalSupply() + count <= MAXCOLLECTIONSIZE, "Collection is sold out");
    require(count <= batchMintLimit, "Limit per transaction exeeded");

    for(uint i; i<count; i++) {
      _mint(to, totalSupply()+1);
    }
  }

  function getSigner(bytes memory signedMessage) view private returns (address signer) {
    bytes memory bMessage = abi.encode(msg.sender);
    bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", bMessage));
    signer = ECDSA.recover(hash, signedMessage);
  }

  function _baseURI() internal view override returns (string memory) {
    return baseURI;
  }
}