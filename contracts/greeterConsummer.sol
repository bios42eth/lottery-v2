//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./greeter.sol";

contract GreeterConsummer {
    Greeter private greeter;

    constructor(Greeter _greeter) {
        greeter = _greeter;
    }

    function greetForReal() public view returns (string memory) {
        return greeter.greet();
    }
}