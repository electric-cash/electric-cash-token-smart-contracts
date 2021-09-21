const welcash = artifacts.require("Welcash");

const {
    time,
    expectRevert, // Assertions for transactions that should fail
    expectEvent
} = require('@openzeppelin/test-helpers');

contract("welcash", (accounts) => {
  let instance;

  beforeEach(async () => {
      instance = await welcash.new();
  })

  async function checkBalance(address, expectedBalance){
    balance = await instance.balanceOf.call(address);
    assert.equal(web3.utils.toHex(balance.valueOf()), web3.utils.toHex(expectedBalance), "Incorrect balance, expected "
    + address + " balance to be " + expectedBalance + " instead of " + balance);
  }

  it('should have Welcash name and 8 decimals precision', async () => {
    assert.equal(await instance.name(), "Wrapped Electric Cash", "name should be Wrapped Electric Cash");
    assert.equal(await instance.symbol(), "wELCASH", "symbol should be wELCASH");
    assert.equal(await instance.decimals(), 8, "decimal precision should be 8")
  });

  it('should have 0 coins as initial amount', async () => {
    await checkBalance(accounts[0], "0");
  });

  it('should increase value after mint', async () => {
    await instance.mint(accounts[0], 20);
    await checkBalance(accounts[0], "20");
  });

  it('should not exceed elcash supply', async () => {
    await instance.mint(accounts[0], 20000000*1e8);
    await expectRevert(instance.mint(accounts[0], 20000000*1e8), "wElcash supply exceeded");
  });
  //TODO: what supply?

 it('should burn if sent to burn address', async() => {
    await instance.mint(accounts[0], 20);
    burnAddress = "0x00000000000000000000000000000000FfFFffF0";
    await instance.transfer(burnAddress, 3);
    await checkBalance(accounts[0], "17");
    await checkBalance(burnAddress, "0");
 })

  it('should perform succesful transfer', async () => {
    await instance.mint(accounts[0], 20);
    await instance.transfer(accounts[1], 3);
    await checkBalance(accounts[0], "17");
    await checkBalance(accounts[1], "3");
  });

  it('should perform succesful transferFrom', async () => {
    await instance.mint(accounts[0], 20);
    await instance.approve(accounts[1], 10, {from: accounts[0]})
    await instance.transferFrom(accounts[0], accounts[2], 3, {from: accounts[1]});
    await checkBalance(accounts[0], "17");
    await checkBalance(accounts[1], "0");
    await checkBalance(accounts[2], "3");
  });

  it('should revert if transferFrom exceeds allowance', async () => {
    await instance.mint(accounts[0], 20);
    await instance.approve(accounts[1], 10, {from: accounts[0]})
    await instance.transferFrom(accounts[0], accounts[2], 4, {from: accounts[1]});
    expectRevert(instance.transferFrom(accounts[0], accounts[2], 7, {from: accounts[1]}), "ERC20: transfer amount exceeds allowance");
  });

/// BLOCKING FEATURE

  it('should not allow blocked user to make transfer', async () => {
    await instance.mint(accounts[1], 3);
    await instance.blockUser(accounts[1])
    await expectRevert(instance.transfer(accounts[2], 2, {from: accounts[1]}), 'User is blocked');
    await expectRevert(instance.transferFrom(accounts[0], accounts[2], 2, {from: accounts[1]}), 'User is blocked');
    await expectRevert(instance.transferFrom(accounts[1], accounts[2], 2, {from: accounts[0]}), 'User is blocked');
  });

  it('should allow unblocked user to make transfer', async () => {
    await instance.mint(accounts[1], 3);
    await instance.unblockUser(accounts[1]);
    await instance.transfer(accounts[2], 1, {from: accounts[1]});
    await checkBalance(accounts[1], "2");
    await checkBalance(accounts[2], "1");
  });

  it('should not allow blocked user to make allowance', async () => {
    await instance.mint(accounts[1], 3);
    await instance.blockUser(accounts[1])
    await expectRevert(instance.approve(accounts[2], 1, {from: accounts[1]}), 'User is blocked');
  });

  it('should perform succesful transfer from allowance', async () => {
    await instance.mint(accounts[0], 10);
    await instance.approve(accounts[1], 2, {from: accounts[0]});
    allowance = await instance.allowance.call(accounts[0], accounts[1]);
    assert.equal(web3.utils.toHex(allowance.valueOf()), web3.utils.toHex('2'), "2 wasn't the allowance");
    await instance.transferFrom(accounts[0], accounts[2], 1, {from: accounts[1]})
    await checkBalance(accounts[0], "9");
    await checkBalance(accounts[1], "0");
    await checkBalance(accounts[2], "1");
  });

  it('should not allow transfer when paused', async () => {
    await instance.mint(accounts[1], 3);
    await instance.pause({from: accounts[0]});
    await expectRevert(instance.transfer(accounts[2], 1, {from: accounts[1]}), 'Pausable: paused');
  });

  it('should allow transfer when unpaused', async () => {
    await instance.mint(accounts[1], 3);
    await instance.pause({from: accounts[0]});
    await instance.unpause({from: accounts[0]});
    await instance.transfer(accounts[2], 1, {from: accounts[1]});
    await checkBalance(accounts[2], "1");
  });

/// OWNERSHIP FEATURE

  it('should revert onlyOwner method calls from not owner', async () => {
    await expectRevert(instance.mint(accounts[0], 20, {from: accounts[1]}), 'Ownable: caller is not the owner');
    await expectRevert(instance.blockUser(accounts[0], {from: accounts[1]}), 'Ownable: caller is not the owner');
  });
});
