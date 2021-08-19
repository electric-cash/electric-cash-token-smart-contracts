// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract Welcash is ERC20Burnable, Pausable, Ownable{

  uint256 immutable private _maxSupply = 21000000*1e8;
  address immutable private _lastBurnAddress = 0x0000000000000000000000000000fFfffFFfFfff;
  mapping(address => bool) public blocked;
  event Burn(address indexed from, address indexed to, uint256 value);

  constructor() ERC20("Wrapped Electric Cash", "wELCASH") {
  }

  function decimals() public pure override returns (uint8) {
    return 8;
  }

  function pause() public onlyOwner{
    _pause();
  }

  function unpause() public onlyOwner{
    _unpause();
  }

  function isBurnAddress(address addr) public view returns (bool){
    if(addr < _lastBurnAddress)
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
      super.burn(amount);
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
    super._approve(_msgSender(), spender, amount);
  }

//  function approve(address spender, uint256 amount) public override returns (bool) {
//    require(!blocked[msg.sender], 'User is blocked');
//    _approve(_msgSender(), spender, amount);
//    return true;
//  }

  function mint(address addr, uint256 amount) external onlyOwner{
    require(totalSupply() + amount < _maxSupply, "wElcash supply exceeded");
    super._mint(addr, amount);
  }

  function burn(uint256 amount) public virtual override{
    revert("burn method disabled");
  }

  function burnFrom(address account, uint256 amount) public virtual override onlyOwner{
    revert("burnFrom method disabled");
  }

  function blockUser(address userAddress) external onlyOwner{
    blocked[userAddress] = true;
  }

  function unblockUser(address userAddress) external onlyOwner{
    blocked[userAddress] = false;
  }
}
