// SPDX-License-Identifier: Unlicensed
pragma solidity 0.8.7;

contract Lottery {
  function bet(uint256[6] calldata numbers) external {
    // TODO : Check if possible to compress the uint256[6] ?
    // TODO : check if someone can play multiple times or not
  }

  function draw() external {
    // check access right : open to anyone ?
  }
}