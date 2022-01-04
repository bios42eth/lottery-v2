// SPDX-License-Identifier: UNLICENCED

pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract myERC721 is ERC721PresetMinterPauserAutoId {
    constructor() ERC721PresetMinterPauserAutoId(
      "Bios42 NFT",
      "B42NFT",
      "ipfs://warpzone") {
    }
}