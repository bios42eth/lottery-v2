import { ethers } from "hardhat";

async function main() {
  console.log('Deployer IN');
  const [deployer] = await ethers.getSigners();
  console.log("Account    ", deployer.address);
  console.log("Balance    ", (await deployer.getBalance()).toString());

  let network = await ethers.provider.getNetwork()
  let IPFSFOLDER, OWNER, PROXY;

  console.log("Network      : ", network.name)
  if (network.name === 'rinkeby') {
    OWNER = "0x6cCD50e49b4f0b926809f5d20bBF4BAb1116fF37" // Bios42
    IPFSFOLDER = "ipfs://warpzone/"
    PROXY = "0x1E525EEAF261cA41b809884CBDE9DD9E1619573A" // Opensea rinkeby

  } else if (network.name === "homestead") {
    OWNER = ""
    IPFSFOLDER = "ipfs://warpzone/"
    PROXY = "0xa5409ec958c83c3f309868babaca7c86dcb077c1"// Opensea mainnet

    console.log('Deploying Token on mainnet too early !');
    process.exit()

  } else {
    console.log('Unhandled network : ',network.name)
    process.exit()
  }

  const Token = await ethers.getContractFactory('AgoraBoars');
  console.log('Deploying Token...');
  console.log('OWNER      ',OWNER);
  console.log('IPFSFOLDER ', IPFSFOLDER);
  console.log('PROXY      ',PROXY);

  console.log("await Token.deploy(params)")
  let token = (await Token.deploy(
    OWNER,
    IPFSFOLDER,
    PROXY));

  console.log("await token.deployed()")
  await token.deployed();
  console.log("Contract   ",token.address)
  console.log("Run         npx hardhat verify %s \"%s\" \"%s\" \"%s\"",token.address, OWNER, IPFSFOLDER, PROXY)

  console.log('Deployer OUT');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });