// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

// ERC20 inherit erc20 
import "../IWETH.sol";
import "hardhat/console.sol";

contract WethMock is IWETH {
    string public name     = "Wrapped Ether";
    string public symbol   = "WETH";
    uint8  public decimals = 18;

    event  Approval(address indexed src, address indexed guy, uint wad);
    event  Transfer(address indexed src, address indexed dst, uint wad);
    event  Withdrawal(address indexed src, uint wad);

    mapping (address => uint256)                       public  balanceOf;
    mapping (address => mapping (address => uint256))  public  allowance;

    receive() external payable {
        this.deposit();
    }
    function deposit() override external payable {
        console.log("beer");
        balanceOf[msg.sender] += msg.value;
    }
    function withdraw(uint wad) override public {
        require(balanceOf[msg.sender] >= wad);
        balanceOf[msg.sender] -= wad;
        (bool sent, bytes memory data) = address(this).call{value: wad}("Depositing");
        if (sent == false) {
          revert("Eth send failed");
        }
        emit Withdrawal(msg.sender, wad);
    }

    function totalSupply() public view returns (uint) {
        return address(this).balance;
    }

    function approve(address guy, uint wad) override public {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
    }

    function transfer(address dst, uint wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(address src, address dst, uint wad)
        public
        returns (bool)
    {
        require(balanceOf[src] >= wad);

        if (src != msg.sender) {
            require(allowance[src][msg.sender] >= wad);
            allowance[src][msg.sender] -= wad;
        }

        balanceOf[src] -= wad;
        balanceOf[dst] += wad;

        emit Transfer(src, dst, wad);

        return true;
    }
}
