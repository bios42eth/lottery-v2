// SPDX-License-Identifier: UNLICENCED

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract SafeMoon is ERC20PresetMinterPauser {
    constructor() ERC20PresetMinterPauser("SafeMoon", "SFMN") {
    }
}