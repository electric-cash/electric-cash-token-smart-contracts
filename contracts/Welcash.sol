// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract Welcash is ERC20, Pausable, Ownable{

  uint256 constant private MAX_SUPPLY = 21*1e6*1e8; // 21MM
  address constant private LAST_BURN_ADDRESS = 0x0000000000000000000000000000fFfffFFfFfff;
  mapping(address => bool) public blocked;
  event Burn(address indexed from, address indexed to, uint256 value);

  constructor() ERC20("Wrapped Electric Cash", "wELCASH") {
  }

  function decimals() public pure override returns (uint8) {
    return 8;
  }

  function pause() external onlyOwner{
    _pause();
  }

  function unpause() external onlyOwner{
    _unpause();
  }

  function isBurnAddress(address addr) public pure returns (bool){
    if(addr < LAST_BURN_ADDRESS)
      return true;
    else return false;
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override whenNotPaused{
    require(!blocked[msg.sender], 'User is blocked');
    super._beforeTokenTransfer(from, to, amount);
  }

  function _transfer(address sender, address recipient, uint256 amount) internal virtual override{
    if(isBurnAddress(recipient)){
      emit Burn(sender, recipient, amount);
      _burn(sender, amount);
      return;
    }
    super._transfer(sender, recipient, amount);
  }

  function transferFrom(address sender, address recipient, uint256 amount) public virtual override whenNotPaused returns (bool){
    require(!blocked[msg.sender], 'User is blocked');
    require(!blocked[sender], 'User is blocked');
    return super.transferFrom(sender, recipient, amount);
  }

  function _approve(address owner, address spender, uint256 amount) internal virtual override {
    require(!blocked[msg.sender], 'User is blocked');
    super._approve(owner, spender, amount);
  }

  function mint(address addr, uint256 amount) external onlyOwner{
    require(totalSupply() + amount < MAX_SUPPLY, "wElcash supply exceeded");
    super._mint(addr, amount);
  }

  function blockUser(address userAddress) external onlyOwner{
    blocked[userAddress] = true;
  }

  function unblockUser(address userAddress) external onlyOwner{
    blocked[userAddress] = false;
  }
}
