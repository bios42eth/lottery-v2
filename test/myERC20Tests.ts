import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, waffle } from "hardhat";
import { Contract } from 'ethers'
import { expect } from "chai";
const { deployContract, loadFixture } = waffle;
const {parseEther} = ethers.utils;

import MyERC20 from "../artifacts/contracts/MyERC20.sol/MyERC20.json";
import { MyERC20 as myToken } from "../typechain/MyERC20";

describe("MyERC20 Contract", async function () {
  let developer: string;
  let developerAcc: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let tokenAddress : string;

  let token: myToken ;
  before(async () => {
    const signers = await ethers.getSigners();
    developerAcc = signers[0];
    developer = developerAcc.address;
    alice = signers[1];
    bob = signers[2];
  });

  async function fixture() {} // For now we just use this to snapshot and revert the state of the blockchain

  this.beforeEach(async () => {
    await loadFixture(fixture);
  })

  this.beforeAll(async () => {
    console.log('Starting beforeAll...');

    const Token = await ethers.getContractFactory('MyERC20');
    console.log('Deploying Token...');
    token = await Token.deploy() as myToken;
    await token.deployed();
    tokenAddress = token.address
    console.log("tokenAddress : ",tokenAddress)


    console.log("Finished setup. Ready to test.")
  });

  describe("Settings", function() {

    it('should have the right name', async function() {
      expect(await token.name()).to.eq("Bios42")
      expect(await token.symbol()).to.eq("B42")
    })

  })
});