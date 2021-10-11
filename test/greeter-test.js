const { expect } = require("chai");
const { ethers } = require("hardhat");
const { smockit } = require("@eth-optimism/smock");
const { smoddit } = require("@eth-optimism/smock");

describe("Greeter", function () {
	let greeter;

	beforeEach(async () => {
        const Greeter = await ethers.getContractFactory("Greeter");
        greeter = await Greeter.deploy("Hello, world!");
        await greeter.deployed();
    });


  it("Should return the new greeting once it's changed", async function () {

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });

  it("Should be mockable", async function() {
    const MyMockContract = await smockit(greeter);
    MyMockContract.smocked.greet
                    .will.return.with("Yo, dlrow");

    const GreeterConsummer = await ethers.getContractFactory("GreeterConsummer");
    const consummer = await GreeterConsummer.deploy(MyMockContract.address);
    await consummer.deployed();

    await consummer.greetForReal();

    expect(MyMockContract.smocked.greet.calls.length)
                    .to.be.equal(1);

  });

});