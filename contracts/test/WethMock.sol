// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

// ERC20 inherit erc20 
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../IWETH.sol";

contract WethMock is IWETH {

  function deposit() override external payable {}
  function withdraw(uint256 value) override external {}
  function approve(address spender, uint256 amount) public virtual override {}
}