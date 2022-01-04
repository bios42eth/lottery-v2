// SPDX-License-Identifier: UNLICENCED

pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract myERC20 is ERC20PresetMinterPauser {
    constructor() ERC20PresetMinterPauser("Bios42", "B42") {
    }
}