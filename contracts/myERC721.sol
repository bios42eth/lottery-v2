// SPDX-License-Identifier: UNLICENCED

pragma solidity ^0.8.7;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/common/ERC2981.sol';
import '@openzeppelin/contracts/finance/PaymentSplitter.sol';

import '@openzeppelin/contracts/access/Ownable.sol';

import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MyERC721 is ERC721Enumerable, ERC2981, PaymentSplitter, Ownable {

  bool public isWhitelistMintingOpened;
  bool public isPublicMintingOpened;

  uint16 public MAXCOLLECTIONSIZE = 10000;
  uint16 public batchMintLimit = 20;
  uint16 public WLLIMIT = 1000;

  address public whiteListSigner;
  bytes32 public merkleRoot;

  string public baseURI;
  address public proxyRegistryAddress;
  // Rinkeby: 0xf57b2c51ded3a29e6891aba85459d600256cf317
  // Mainnet: 0xa5409ec958c83c3f309868babaca7c86dcb077c1

  event WhitelistMintFlipped(bool wlMint);
  event PublicMintFlipped(bool publicMint);
  event WhiteListSignerUpdated(address signer);
  event BaseURIUpdated(string newURI);
  event BatchMintLimitUpdated(uint16 newLimit);
  event CollectionSizeUpdated(uint16 newLimit);
  event WhiteListLimitUpdated(uint16 newLimit);
  event Withdrawn(uint256 amount);
  event DefaultRoyaltySet(address receiver, uint96 feeNumerator);

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
      setDefaultRoyalty(owner, 1000); // 10% fees
  }

  //
  // Collection settings
  //

  function setBaseURI(string calldata _newBaseURI) external onlyOwner {
    baseURI = _newBaseURI;
    emit BaseURIUpdated(_newBaseURI);
  }

  function _baseURI() internal view override returns (string memory) {
    return baseURI;
  }

  // 10% => feeNumerator = 1000
  function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyOwner{
    _setDefaultRoyalty(receiver, feeNumerator);
    emit DefaultRoyaltySet(receiver, feeNumerator);
  }

  // OpenSea specifics
  function isApprovedForAll(address _owner, address operator) public view override returns (bool) {
    MarketplaceProxyRegistry proxyRegistry = MarketplaceProxyRegistry(proxyRegistryAddress);
    if (address(proxyRegistry.proxies(_owner)) == operator) return true;
    return super.isApprovedForAll(_owner, operator);
  }

  function setProxyRegistry(address _proxyRegistryAddress) public onlyOwner {
    proxyRegistryAddress = _proxyRegistryAddress;
  }

  // Contract metadata URI - Support for OpenSea: https://docs.opensea.io/docs/contract-level-metadata
  function contractURI() public view returns (string memory) {
      return string(abi.encodePacked(_baseURI(), "contract.json"));
  }

  // Helpers
  function tokensOfOwner(address owner) external view returns (uint256[] memory) {
    uint256 tokenCount = balanceOf(owner);
    uint256[] memory result = new uint256[](tokenCount);
    for (uint256 index; index < tokenCount; index++) {
        result[index] = tokenOfOwnerByIndex(owner, index);
    }
    return result;
  }

  //
  // Mint
  //

  function publicPrice() public pure returns (uint256) {
    return 0.15 ether;
  }

  function setMaxCollectionSize(uint16 _limit) external onlyOwner {
    MAXCOLLECTIONSIZE = _limit;
    emit CollectionSizeUpdated(_limit);
  }

  function mint(uint16 count) external payable {
    require(msg.value >= count * publicPrice(),"Insufficiant amount sent");
    require(isPublicMintingOpened, "Public minting is closed");

    _batchMint(msg.sender, count);
  }

  function updateBatchMintLimit(uint16 newLimit) external onlyOwner {
    batchMintLimit = newLimit;
    emit BatchMintLimitUpdated(newLimit);
  }

  function flipPublicMint() external onlyOwner {
    isPublicMintingOpened = !isPublicMintingOpened;
    emit PublicMintFlipped(isPublicMintingOpened);
  }

  function _batchMint(address to,uint16 count) private {
    require(totalSupply() + count <= MAXCOLLECTIONSIZE, "Collection is sold out");
    require(count <= batchMintLimit, "Limit per transaction exeeded");

    for(uint i; i<count; i++) {
      _mint(to, totalSupply()+1);
    }
  }

  function airdrop(address to, uint16 count) external onlyOwner {
    _batchMint(to, count);
  }
  //
  // Whitelist management
  //

  function flipWhiteListMint() external onlyOwner{
    isWhitelistMintingOpened = !isWhitelistMintingOpened;
    emit WhitelistMintFlipped(isWhitelistMintingOpened);
  }

  function presalePrice() public pure returns (uint256){
    return 0.10 ether;
  }

  function setWLLimit(uint16 _limit) external onlyOwner {
    WLLIMIT = _limit;
    emit WhiteListLimitUpdated(_limit);
  }

  // Merkle tree whitelist

  function merkleTreeWLMint(uint16 _count, bytes32[] memory _proof) external payable {
    require(msg.value >= _count * presalePrice(),"Insufficiant amount sent");
    require(isWhitelistMintingOpened, "Whitelist minting is closed");
    require(totalSupply() + _count <= WLLIMIT, "Presale is sold out");

    bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
    require(MerkleProof.verify(_proof, merkleRoot, leaf), "Address not whitelisted");

    _batchMint(msg.sender, _count);
  }

  function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
    merkleRoot = _merkleRoot;
  }

  // ECDSA Whitelist
  function ecdsaWLMint(uint16 count, bytes memory signedMessage) external payable {
    require(msg.value >= count * presalePrice(),"Insufficiant amount sent");
    require(isWhitelistMintingOpened, "Whitelist minting is closed");
    require(totalSupply() + count <= WLLIMIT, "Presale is sold out");
    require(getSigner(signedMessage) == whiteListSigner, "Address not whitelisted");

    _batchMint(msg.sender, count);
  }

  function updateWhitelistSigner(address newAddress) external onlyOwner {
    whiteListSigner = newAddress;
    emit WhiteListSignerUpdated(newAddress);
  }

  function getSigner(bytes memory signedMessage) view private returns (address signer) {
    bytes memory bMessage = abi.encode(msg.sender);
    bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", bMessage));
    signer = ECDSA.recover(hash, signedMessage);
  }

  // Fund management
  function withdraw() external onlyOwner{
    uint256 amount = address(this).balance;
    Address.sendValue(payable(owner()), amount);
    emit Withdrawn(amount);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, ERC2981) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

}

contract OwnableDelegateProxy {}

contract MarketplaceProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}