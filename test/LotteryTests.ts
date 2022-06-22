import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, waffle } from "hardhat";
import { Contract } from 'ethers'
import { expect } from "chai";
const { deployContract, loadFixture } = waffle;
const {parseEther} = ethers.utils;

import { Lottery } from "../typechain/Lottery";

describe("Lottery Contract", async function () {
  let developer: string;
  let developerAcc: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let tokenAddress : string;

  let lottery: Lottery ;
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

    const Contract = await ethers.getContractFactory('Lottery');
    console.log('Deploying Token...');
    lottery = await Contract.deploy() as Lottery;
    await lottery.deployed();
    tokenAddress = lottery.address
    console.log("Finished setup. Ready to test.")
  });

  describe("Bet", function() {
    it('shouldwork fine')
  })
});