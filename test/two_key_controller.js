const TwoKeyController = artifacts.require("TwoKeyController");
const welcash = artifacts.require("Welcash");
const {BN, expectRevert } = require('@openzeppelin/test-helpers');

contract("TwoKeyController", function (accounts) {
  let controller;
  let token;

  beforeEach(async () => {
    token = await welcash.new()
    controller = await TwoKeyController.new(token.address, [accounts[0], accounts[1]]);
    token.transferOwnership(controller.address)
  })

  it('should not deploy if signers count is 1', async () => {
    await expectRevert(TwoKeyController.new(token.address, [accounts[0]]), "There should be exactly two signer");
  });

  it('should not deploy if signers count is 3', async () => {
    await expectRevert(TwoKeyController.new(token.address, [accounts[0], accounts[1], accounts[2]]), "There should be exactly two signer");
  });

  it('should add pending mint proposal', async () => {
    const MINT_TARGET = accounts[9];
    const MINT_AMOUNT = 1200000;

    await controller.proposeMint(MINT_TARGET, MINT_AMOUNT);
    mintProposal = await controller.mintProposals(accounts[0]);
    await assert.equal(mintProposal["recipient"], MINT_TARGET, "Should have pending mint to same recipient");
    await assert.equal(mintProposal["amount"], MINT_AMOUNT, "Should have pending mint of same value");
  });

  it('should add pending ownership change proposal', async () => {
    const NEW_OWNER = accounts[9];

    await controller.proposeOwnershipChange(NEW_OWNER);
    ownershipChangeProposal = await controller.ownershipChangeProposals(accounts[0]);
    await assert.equal(ownershipChangeProposal, NEW_OWNER, "Should have pending ownership change to same address");
  });

  it('should not add minted amount before confirmation', async () => {
    const MINT_TARGET = accounts[9];
    const MINT_AMOUNT = 1200000;

    balance = await token.balanceOf.call(MINT_TARGET);
    assert.equal(web3.utils.toHex(balance.valueOf()), web3.utils.toHex('0'), "mint target account balance should be 0 before mint proposal");
    await controller.proposeMint(MINT_TARGET, MINT_AMOUNT, {from: accounts[0]});
    assert.equal(web3.utils.toHex(balance.valueOf()), web3.utils.toHex('0'), "mint target account balance should be 0 before confirmation");
  });

  it('should not transfer ownership before confirmation', async () => {
    const NEW_OWNER = accounts[9];

    await controller.proposeOwnershipChange(NEW_OWNER);
    assert.equal(await token.owner(), controller.address);
  });

  it('should add minted amount after confirmation', async () => {
    const MINT_TARGET = accounts[9];
    const MINT_AMOUNT = 1200000;

    balance = await token.balanceOf.call(MINT_TARGET);
    await controller.proposeMint(MINT_TARGET, MINT_AMOUNT, {from: accounts[0]});
    await controller.confirmMintProposal(accounts[0], MINT_TARGET, MINT_AMOUNT, {from: accounts[1]});
    balance = await token.balanceOf.call(MINT_TARGET);
    assert.equal(web3.utils.toHex(balance.valueOf()), web3.utils.toHex(MINT_AMOUNT), "mint target account balance should be 1200000 after mint confirmation");
  });

  it('should transfer ownership after confirmation', async () => {
    const NEW_OWNER = accounts[9];

    await controller.proposeOwnershipChange(NEW_OWNER);
    await controller.confirmOwnershipChangeProposal(accounts[0], NEW_OWNER, {from: accounts[1]})
    assert.equal(await token.owner(), NEW_OWNER);
  });

  it('should revert if mint proposal revoked but not proposed', async () => {
    const MINT_TARGET = accounts[9];
    const MINT_AMOUNT = 1200000;

    await expectRevert(controller.revokeMintProposal({from: accounts[0]}), "No proposal to revoke");
  });

  it('should revert if ownership change proposal revoked but not proposed', async () => {
    const NEW_OWNER = accounts[9];

    await expectRevert(controller.revokeOwnershipChangeProposal({from: accounts[0]}), "No proposal to revoke");
  });

  it('should revoke pending mint proposal', async () => {
    const MINT_TARGET = accounts[9];
    const MINT_AMOUNT = 1200000;

    await controller.proposeMint(MINT_TARGET, MINT_AMOUNT);
    await controller.revokeMintProposal({from: accounts[0]})
    mintProposal = await controller.mintProposals(accounts[0]);
    await assert.equal(mintProposal["recipient"], 0, "Should have no recipient after mint proposal revocation");
    await assert.equal(mintProposal["amount"], 0, "Should have no amount after mint proposal revocation");
  });

  it('should revoke pending ownership change proposal', async () => {
    const NEW_OWNER = accounts[9];

    await controller.proposeOwnershipChange(NEW_OWNER);
    await controller.revokeOwnershipChangeProposal({from: accounts[0]})
    ownershipChangeProposal = await controller.ownershipChangeProposals(accounts[0]);
    await assert.equal(ownershipChangeProposal, 0, "Should have no ownership change proposal after revocation");
  });

  it('should not mint after confirmation of not proposed mint', async () => {
    const MINT_TARGET = accounts[9];
    const MINT_AMOUNT = 1200000;

    await controller.confirmMintProposal(accounts[0], MINT_TARGET, MINT_AMOUNT, {from: accounts[1]});
    balance = await token.balanceOf.call(MINT_TARGET);
    assert.equal(web3.utils.toHex(balance.valueOf()), web3.utils.toHex(0), "mint target account balance should be 0 after mint confirmation without proposal");
  });

  it('should not change ownership after confirmation of not proposed change', async () => {
    const NEW_OWNER = accounts[9];

    await controller.confirmOwnershipChangeProposal(accounts[0], NEW_OWNER, {from: accounts[1]});
    assert.equal(await token.owner(), controller.address);
  });

});
