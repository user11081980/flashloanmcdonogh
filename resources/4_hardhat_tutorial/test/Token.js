const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai"); // chai provides asserting functions

describe("Token contract", function () {
  async function deployTokenFixture() { // look at this address to learn how to call fixtures
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await ethers.deployContract("Token");

    // Fixtures can return anything you consider useful for your tests
    return { hardhatToken, owner, addr1, addr2 };
  };

  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners(); // gets list of accounts registered in local Ethereum node or Hardhat Network
                                               // gets 20 defaults signers, where the notation [owner] declares the constant owner and sets it to the first signer
                                               // used in development environments as a convenient way to access test accounts and simulate different users

    const hardhatToken = await ethers.deployContract("Token");

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async function() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    
    const hardhatToken = await ethers.deployContract("Token");

    // Transfer 50 tokens from owner to addr1
    await hardhatToken.transfer(addr1.address, 50);
    expect(await hardhatToken.balanceOf(addr1.address)).to.equal(50);

    // Transfer 50 tokens from addr1 to addr2
    await hardhatToken.connect(addr1).transfer(addr2.address, 50); // connect is used to impersonate one of the accounts
    expect(await hardhatToken.balanceOf(addr2.address)).to.equal(50);
  });
});