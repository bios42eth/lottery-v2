import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, waffle } from "hardhat";
import { expect } from "chai";
const { loadFixture } = waffle;

import MyERC721 from "../artifacts/contracts/MyERC721.sol/MyERC721.json";
import { MyERC721 as MyERC721Contract } from "../typechain/MyERC721";
import { BigNumber } from "ethers";
import { equal } from "assert";
import { parseEther } from "ethers/lib/utils";


// https://github.com/davidrazmadzeExtra/Merkle_Tree_Whitelist_NFT/blob/main/merkle_tree.js
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/utils/cryptography/MerkleProof.test.js
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("MyERC721 Contract", async function () {
  let developer: SignerWithAddress;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charly: SignerWithAddress;
  let whiteListSigner: SignerWithAddress;
  let tokenAddress : string;
  let zeroAddress : string;
  let collection: MyERC721Contract;
  before(async () => {
    const signers = await ethers.getSigners();
    developer = signers[0];
    owner = signers[1];
    alice = signers[2];
    bob = signers[3];
    whiteListSigner = signers[4]
    charly = signers[5];
    zeroAddress="0x0000000000000000000000000000000000000000"
  });
  const DEFAULT_URL = "ipfs://warpzone/";

  async function fixture() {} // For now we just use this to snapshot and revert the state of the blockchain

  this.beforeEach(async () => {
    await loadFixture(fixture);
  })

  this.beforeAll(async () => {
    console.log('Starting beforeAll...');

    const Token = await ethers.getContractFactory('MyERC721');
    console.log(typeof Token)
    console.log('Deploying Token...');
    collection = await Token.deploy(
      whiteListSigner.address,
      owner.address,
      [alice.address, bob.address],
      [875, 125],
      DEFAULT_URL) as MyERC721Contract;
    await collection.deployed();
    tokenAddress = collection.address
    console.log("tokenAddress : ",tokenAddress)

    console.log("Finished setup. Ready to test.")

  });

  describe("Settings", function() {
    it('should have the right name', async function() {
      expect(await collection.name()).to.eq("My ERC721")
      expect(await collection.symbol()).to.eq("MYERC721")
    })
  })

  describe("Price management", function() {
    it('should change price according to item count', async function() {
      await collection.connect(owner).updateBatchMintLimit(100)
      let price = await collection.price()

      await collection.connect(owner).flipPublicMint()
      expect(await collection.price()).to.eq(ethers.utils.parseEther("0.03"))

      await collection.connect(alice).mint(50, {value: price.mul(100)})
      price = await collection.price()
      expect(price).to.eq(ethers.utils.parseEther("0.030"))

      await collection.connect(alice).mint(50, {value: price.mul(100)})
      price = await collection.price()
      expect(price).to.eq(ethers.utils.parseEther("0.032"))

      await collection.connect(alice).mint(70, {value: price.mul(100)})
      price = await collection.price()
      expect(price).to.eq(ethers.utils.parseEther("0.032"))

      await collection.connect(alice).mint(30, {value: price.mul(100)})
      price = await collection.price()
      expect(price).to.eq(ethers.utils.parseEther("0.034"))

    expect(await collection.ownerOf(1)).to.eq(alice.address)
    })
  })

  describe("Minting", function() {

    it('should be closed by default', async function() {
      await expect(collection.connect(alice).mint(3, {value: (await collection.price()).mul(3)})).to
        .be.revertedWith('Public minting is closed')
    })

    it('should check that only the owner can open the public mint', async function() {
      await expect(collection.connect(alice).flipPublicMint()).to.be
        .revertedWith("Ownable: caller is not the owner")
    })

    it('should send an event when flipping', async function() {
      await expect(collection.connect(owner).flipPublicMint()).to
        .emit(collection, "PublicMintFlipped")
        .withArgs(true)

      await expect(collection.connect(owner).flipPublicMint()).to
        .emit(collection, "PublicMintFlipped")
        .withArgs(false)
    })

    describe('when opened', function() {
      this.beforeEach(async function() {
        await collection.connect(owner).flipPublicMint()
        expect(await collection.isPublicMintingOpened()).to.eq(true)
      })

      it('allow to mint', async function() {
        await expect(collection.connect(alice).mint(3, {value: (await collection.price()).mul(3)})).to
          .emit(collection, "Transfer")
          .withArgs(zeroAddress,alice.address, 1)

        expect(await collection.ownerOf(1)).to.eq(alice.address)
        expect(await collection.ownerOf(2)).to.eq(alice.address)
        expect(await collection.ownerOf(3)).to.eq(alice.address)
      })

      it('fail if price is too low', async function() {
        await expect(collection.connect(alice).mint(2, {value: await collection.price()})).to
          .be.revertedWith('Insufficiant amount sent')
      })

      describe("Collection limits", function() {
        // it('should check the collection count', async function() {
        //   await collection.connect(owner).updateBatchMintLimit(100)

        //   //const maxSize = 12000
        //   for (let i = 0; i<120; i++) {
        //     await collection.connect(alice).mint(100, {value: (await collection.price()).mul(100)})
        //   }

        //   await expect(collection.connect(alice).mint(1, {value: (await collection.price()).mul(1)}))
        //     .to.be.revertedWith("Collection is sold out")
        // })
      })
    })

    describe.only('whitelist Merkle Tree minting', function() {
      let merkleTree : typeof MerkleTree;
      this.beforeAll(async function() {
        let whiteList = ["0X5B38DA6A701C568545DCFCB03FCB875F56BEDDC4",
          "0X5A641E5FB72A2FD9137312E7694D42996D689D99",
          "0XDCAB482177A592E424D1C8318A464FC922E8DE40",
          "0X6E21D37E07A6F7E53C7ACE372CEC63D4AE4B6BD0",
          "0X09BAAB19FC77C19898140DADD30C4685C597620B",
          "0XCC4C29997177253376528C05D3DF91CF2D69061A",
          "0xdD870fA1b7C4700F2BD7f44238821C26f7392148",
          alice.address,
          bob.address]
        merkleTree = new MerkleTree(whiteList, keccak256, { hashLeaves: true, sortPairs: true });
        await collection.connect(owner).setMerkleRoot(merkleTree.getRoot())
      })

      it('should be closed by default', async function() {
        let proof = merkleTree.getHexProof(keccak256(alice.address))

          await expect(collection.connect(alice).merkleTreeWLMint(1, proof, {value: await collection.price()})).to
            .be.revertedWith('Whitelist minting is closed')
      })

      it('should check that only the owner can open the wlmint', async function() {
        await expect(collection.connect(alice).flipWhiteListMint()).to.be
          .revertedWith("Ownable: caller is not the owner")
      })

      it('should send an event when flipping', async function() {
        await expect(collection.connect(owner).flipWhiteListMint()).to
          .emit(collection, "WhitelistMintFlipped")
          .withArgs(true)

        await expect(collection.connect(owner).flipWhiteListMint()).to
          .emit(collection, "WhitelistMintFlipped")
          .withArgs(false)
      })

      describe('when opened', function() {
        this.beforeEach(async function() {
          await collection.connect(owner).flipWhiteListMint()
          expect(await collection.isWhitelistMintingOpened()).to.eq(true)
        })

        it('should check signature', async function () {
          let proof = merkleTree.getHexProof(keccak256(alice.address))

          await expect(collection.connect(alice).merkleTreeWLMint(1, proof, {value: await collection.price()})).to
            .emit(collection, "Transfer")
            .withArgs(zeroAddress,alice.address, 1)
        })

        it('should reject invalid signature', async function () {
          let proof = merkleTree.getHexProof(keccak256(charly.address))

          await expect(collection.connect(alice).merkleTreeWLMint(1, proof, {value: await collection.price()}))
            .to.be.revertedWith("Address not approved")
        })


        it('fail if price is too low', async function() {
          let proof = merkleTree.getHexProof(keccak256(alice.address))

          await expect(collection.connect(alice).merkleTreeWLMint(2, proof, {value: await collection.price()})).to
            .be.revertedWith('Insufficiant amount sent')
        })

        it('should only allow owner to update whitelister', async function () {
          await expect(collection.connect(alice).setMerkleRoot(merkleTree.getRoot()))
                .to.be.revertedWith("Ownable: caller is not the owner")

        })
      })
    })

    describe('whitelist ECDSA minting', function() {
      it('should be closed by default', async function() {
          let encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"],[alice.address])
          let signedMessage = await whiteListSigner.signMessage(ethers.utils.arrayify(encodedAddress))

          await expect(collection.connect(alice).ecdsaWLMint(1, signedMessage, {value: await collection.price()})).to
            .be.revertedWith('Whitelist minting is closed')
      })

      it('should check that only the owner can open the wlmint', async function() {
        await expect(collection.connect(alice).flipWhiteListMint()).to.be
          .revertedWith("Ownable: caller is not the owner")
      })

      it('should send an event when flipping', async function() {
        await expect(collection.connect(owner).flipWhiteListMint()).to
          .emit(collection, "WhitelistMintFlipped")
          .withArgs(true)

        await expect(collection.connect(owner).flipWhiteListMint()).to
          .emit(collection, "WhitelistMintFlipped")
          .withArgs(false)
      })

      describe('when opened', function() {
        this.beforeEach(async function() {
          await collection.connect(owner).flipWhiteListMint()
          expect(await collection.isWhitelistMintingOpened()).to.eq(true)
        })

        it('should check signature', async function () {
          let encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"],[alice.address])
          let signedMessage = await whiteListSigner.signMessage(ethers.utils.arrayify(encodedAddress))

          await expect(collection.connect(alice).ecdsaWLMint(1, signedMessage, {value: await collection.price()})).to
            .emit(collection, "Transfer")
            .withArgs(zeroAddress,alice.address, 1)
        })

        it('fail if price is too low', async function() {
          let encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"],[alice.address])
          let signedMessage = await whiteListSigner.signMessage(ethers.utils.arrayify(encodedAddress))

          await expect(collection.connect(alice).ecdsaWLMint(2, signedMessage, {value: await collection.price()})).to
            .be.revertedWith('Insufficiant amount sent')
        })

        it('should reject invalid signature', async function () {
          let encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"],[bob.address])
          let signedMessage = await whiteListSigner.signMessage(ethers.utils.arrayify(encodedAddress))
          await expect(collection.connect(alice).ecdsaWLMint(1, signedMessage, {value: await collection.price()})).to.be.revertedWith("Address not approved")
        })
      })

      it('should allow to update whitelister', async function () {
        await collection.connect(owner).updateWhitelistSigner(bob.address)

        await collection.connect(owner).flipWhiteListMint()
        let encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"],[alice.address])
        let signedMessage = await whiteListSigner.signMessage(ethers.utils.arrayify(encodedAddress))
        await expect(collection.connect(alice).ecdsaWLMint(1, signedMessage, {value:await collection.price()})).to.be.revertedWith("Address not approved")

        signedMessage = await bob.signMessage(ethers.utils.arrayify(encodedAddress))
        await expect(collection.connect(alice).ecdsaWLMint(1, signedMessage, {value: await collection.price()})).to
          .emit(collection, "Transfer")
          .withArgs(zeroAddress,alice.address, 1)
      })

      it('should only allow owner to update whitelister', async function () {
        await expect(collection.connect(alice).updateWhitelistSigner(alice.address))
          .to.be.revertedWith("Ownable: caller is not the owner")
      })
    })
  })

  describe("batchMintLimit", function() {
    it('should check the limit of batchMintLimit', async function() {
      await collection.connect(owner).flipPublicMint()
      await expect(collection.connect(alice).mint(21, {value: (await collection.price()).mul(21)}))
        .to.be.revertedWith("Limit per transaction exeeded")
    })

    it('should only allow owner to update batchMintLimit', async function () {
      await expect(collection.connect(alice).updateBatchMintLimit(10000))
        .to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe("URL management", function () {
    it('should allow to update default base url', async function() {
      expect(await collection.baseURI()).to.eq(DEFAULT_URL);
      let new_uri = "ipfs://newuri/";
      await collection.connect(owner).setBaseURI(new_uri);
      expect(await collection.baseURI()).to.eq(new_uri);

      await collection.connect(owner).flipPublicMint();
      await collection.connect(owner).mint(1, {value : await collection.price()})
      expect(await collection.tokenURI(1)).to.eq("ipfs://newuri/1")
    })

    it('should check that only admins are allowed to update the uri', async function() {
      let new_uri = "ipfs://newuri/";
      await expect(collection.connect(alice).setBaseURI(new_uri))
        .to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe("Money management with PaymentSplitter", function() {
    it('should allow to retrieve funds', async function () {
      await collection.connect(owner).flipPublicMint()
      await collection.connect(alice).mint(10, {value: (await collection.price()).mul(10)})
      expect(await ethers.provider.getBalance(collection.address)).to.eq(parseEther("0.3"))

      let aliceBalance = await ethers.provider.getBalance(alice.address)
      // WTF : why do I need to write it this way ?!?
      await collection["release(address)"](alice.address)
      let newaliceBalance = await ethers.provider.getBalance(alice.address)

      expect(newaliceBalance.sub(aliceBalance)).to.eq(parseEther("0.3").mul(875).div(1000))

      let bobBalance = await ethers.provider.getBalance(bob.address)
      // WTF : why do I need to write it this way ?!?
      await collection["release(address)"](bob.address)
      let newbobBalance = await ethers.provider.getBalance(bob.address)

      expect(newbobBalance.sub(bobBalance)).to.eq(parseEther("0.3").mul(125).div(1000))

    })
  })

  describe("Enumerable", function() {
    this.beforeEach(async function() {
      await collection.connect(owner).flipPublicMint()
      await expect(collection.connect(alice).mint(3, {value: (await collection.price()).mul(3)})).to
        .emit(collection, "Transfer")
        .withArgs(zeroAddress,alice.address, 1)
      await expect(collection.connect(bob).mint(3, {value: (await collection.price()).mul(3)})).to
        .emit(collection, "Transfer")
        .withArgs(zeroAddress,bob.address, 4)
    })
    it('should be enumerable', async function() {
      expect(await collection.tokenOfOwnerByIndex(bob.address, 0)).to.eq(4)
    })

    it('should return all tokens for a user', async function() {
      expect(await collection.tokensOfOwner(developer.address)).to.deep.equal([])
      expect(await (await collection.tokensOfOwner(bob.address)).toString()).to.eq([4,5,6].toString())
    })
  })
});