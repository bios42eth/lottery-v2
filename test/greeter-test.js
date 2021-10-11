const chai = require("chai");
const expect = chai.expect;
const { ethers } = require("hardhat");
const { smock } = require("@defi-wonderland/smock");

chai.use(smock.matchers);

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
    const mockFactory = await smock.mock('Greeter');
    const mock = await mockFactory.deploy("Hello World");

    mock.greet.returns("Yo, dlrow");

    const GreeterConsummer = await ethers.getContractFactory("GreeterConsummer");
    const consummer = await GreeterConsummer.deploy(mock.address);
    await consummer.deployed();

    await consummer.greetForReal();

    expect(mock.greet).to.have.been.called;
  });

});