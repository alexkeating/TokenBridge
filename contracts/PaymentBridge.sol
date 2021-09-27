/* SPDX-License-Identifier: MIT */
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";



contract PaymentBridge is Initializable {
    
   using AddressUpgradeable for address;
   
   /// @dev treasury address to send to for non-dai tokens
   address public treasuryAddress;
   
   /// @dev wrapAndZap address for Moloch Daos on xdai
   address public wrapAndZap;

   function __PaymentBridge_init_unchained(address _treasuryAddress, address _wrapAndZap) internal initializer{
       treasuryAddress = _treasuryAddress;
       wrapAndZap = _wrapAndZap;
   }

    function __PaymentBridge_init(address _treasuryAddress, address _wrapAndZap) internal initializer {
        __PaymentBridge_init_unchained(_treasuryAddress, _wrapAndZap);
    }

    function initialize(address _treasuryAddress, address _wrapAndZap) public {
        __PaymentBridge_init_unchained(_treasuryAddress, _wrapAndZap);
    }

   // initialize with the below variables
   // - DAO treasury address
   // - wrapnzap address if moloch

   // Two paths
   // - regular erc20 or Eth use omnibridge
   //   - If Eth make sure to wrap it when sending
   // - If xdai use the xdai bridge  
    function pay(uint256 _amount, address tokenAddress) external payable {
        console.log("hi");
        // token address amount
        // convert to an ERC20 check if DAI
        //
        // Get omnibridge 
        // Get xdai Bridge
        // tell if a n ERC20 is from xDAI
        if () {

        }
    }
}
