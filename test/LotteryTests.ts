import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { ethers, waffle } from "hardhat"
import { Contract } from 'ethers'
import { expect } from "chai"
const { deployContract, loadFixture } = waffle
const {parseEther} = ethers.utils

import { Lottery } from "../typechain/Lottery"
import { MyToken } from "../typechain/Mytoken"
import { SafeMoon } from "../typechain/SafeMoon"

describe("Lottery Contract", async function () {
  let developer: string
  let developerAcc: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charly: SignerWithAddress
  let team: SignerWithAddress

  let lottery: Lottery
  let myToken: MyToken
  let safeMoon: SafeMoon

  before(async () => {
    const signers = await ethers.getSigners();
    developerAcc = signers[0];
    developer = developerAcc.address;
    alice = signers[1];
    bob = signers[2];
    team = signers[3];
    charly = signers[4];
  });

  async function fixture() {} // For now we just use this to snapshot and revert the state of the blockchain

  this.beforeEach(async () => {
    await loadFixture(fixture);
  })

  this.beforeAll(async () => {
    console.log('Starting beforeAll...');

    const myTokenContract = await ethers.getContractFactory('myToken');
    myToken = await myTokenContract.deploy() as MyToken;
    await myToken.deployed();

    const SafeMoonContract = await ethers.getContractFactory('SafeMoon');
    safeMoon = await SafeMoonContract.deploy() as SafeMoon;
    await safeMoon.deployed();

    const LotteryContract = await ethers.getContractFactory('Lottery');
    lottery = await LotteryContract.deploy(safeMoon.address, myToken.address, team.address) as Lottery;
    await lottery.deployed();

    await safeMoon.mint(alice.address, parseEther("1000"))
    await safeMoon.connect(alice).approve(lottery.address, parseEther("5"))

    await safeMoon.mint(bob.address, parseEther("1000"))
    await safeMoon.connect(bob).approve(lottery.address, parseEther("5"))

    await safeMoon.mint(charly.address, parseEther("1000"))
    await safeMoon.connect(charly).approve(lottery.address, parseEther("5"))

    console.log("Finished setup. Ready to test.")
  });

  describe("Bet", function() {
    it('should transfer the tokens to the contract', async function() {
      let balanceBefore = await safeMoon.balanceOf(lottery.address)
      await lottery.connect(alice).bet([1,2,3,5,7,11])
      let balanceAfter = await safeMoon.balanceOf(lottery.address)

      expect(balanceAfter.sub(balanceBefore)).to.eq(parseEther("5"))
    })

    it('I should get 30% of the funds if I\'m lucky', async function() {
      await lottery.connect(alice).bet([1,2,3,5,7,11])
      await lottery.draw()

      let balanceBefore = await safeMoon.balanceOf(alice.address)
      await lottery.connect(alice).claim()
      let balanceAfter = await safeMoon.balanceOf(alice.address)

      expect(balanceAfter.sub(balanceBefore)).to.eq(parseEther("0.975")) // = 5 * 0.3 * 0.65
    })

    it('I should split the reward among multiple winners', async function() {
      await lottery.connect(alice).bet([1,2,3,5,7,11])
      await lottery.connect(bob).bet([1,2,3,5,7,11])
      await lottery.connect(charly).bet([1,2,3,5,7,42])
      await lottery.draw()

      let balanceBefore = await safeMoon.balanceOf(alice.address)
      await lottery.connect(alice).claim()
      let balanceAfter = await safeMoon.balanceOf(alice.address)

      expect(balanceAfter.sub(balanceBefore)).to.eq(parseEther("2.925")) // = 3 * 5 * 0.3 * 0.65
    })

    it('I should get 10% of the funds if I get 5 matches', async function() {
      await lottery.connect(alice).bet([1,2,3,5,7,42])
      await lottery.draw()

      let balanceBefore = await safeMoon.balanceOf(alice.address)
      await lottery.connect(alice).claim()
      let balanceAfter = await safeMoon.balanceOf(alice.address)

      expect(balanceAfter.sub(balanceBefore)).to.eq(parseEther("0.325"))
    })

    it('I should get 10% of the funds if I get 4 matches', async function() {
      await lottery.connect(alice).bet([1,2,3,5,42,43])
      await lottery.draw()

      let balanceBefore = await safeMoon.balanceOf(alice.address)
      await lottery.connect(alice).claim()
      let balanceAfter = await safeMoon.balanceOf(alice.address)

      expect(balanceAfter.sub(balanceBefore)).to.eq(parseEther("0.325"))
    })

    it('I should get 15% of the funds if I get 3 matches', async function() {
      await lottery.connect(alice).bet([1,2,3,42,43,44])
      await lottery.draw()

      let balanceBefore = await safeMoon.balanceOf(alice.address)
      await lottery.connect(alice).claim()
      let balanceAfter = await safeMoon.balanceOf(alice.address)

      expect(balanceAfter.sub(balanceBefore)).to.eq(parseEther("0.4875"))
    })

    it('I should get 35% of the funds if I get 2 matches', async function() {
      await lottery.connect(alice).bet([1,2,42,43,44,45])
      await lottery.draw()

      let balanceBefore = await safeMoon.balanceOf(alice.address)
      await lottery.connect(alice).claim()
      let balanceAfter = await safeMoon.balanceOf(alice.address)

      expect(balanceAfter.sub(balanceBefore)).to.eq(parseEther("1.1375"))
    })

    it('should not allow to claim twice')
  })

});