import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, waffle } from "hardhat";
import { Contract } from 'ethers'
import { expect } from "chai";
const { deployContract, loadFixture } = waffle;
const {parseEther} = ethers.utils;

import myERC20 from "../artifacts/contracts/myERC20.sol/myERC20.json";
import { MyERC20 as myToken } from "../typechain/MyERC20";

describe("myERC20 v2 E2E", async function () {
  let developer: string;
  let developerAcc: SignerWithAddress;
  let user1: string;
  let user1Acc: SignerWithAddress;
  let user2: string;
  let user2Acc: SignerWithAddress;
  let tokenAddress : string;

  let token: myToken ;
  before(async () => {
    const signers = await ethers.getSigners();
    developerAcc = signers[0];
    developer = developerAcc.address;
    user1Acc = signers[1];
    user1 = user1Acc.address;
    user2Acc = signers[2];
    user2 = user2Acc.address;
  });

  async function fixture() {} // For now we just use this to snapshot and revert the state of the blockchain

  this.beforeEach(async () => {
    await loadFixture(fixture);
  })

  this.beforeAll(async () => {
    console.log('Starting beforeAll...');

    const Token = await ethers.getContractFactory('myERC20');
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