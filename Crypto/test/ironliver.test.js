const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IronLiver", function () {
  it("deploys and mints initial supply", async function () {
    const [owner] = await ethers.getSigners();
    const IronLiver = await ethers.getContractFactory("IronLiver");
    const initialSupply = ethers.utils.parseUnits("1000000", 18);
    const token = await IronLiver.deploy(initialSupply);
    await token.deployed();

    expect(await token.name()).to.equal("Iron Liver");
    expect(await token.symbol()).to.equal("FeL");
    expect(await token.totalSupply()).to.equal(initialSupply);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  });
});
