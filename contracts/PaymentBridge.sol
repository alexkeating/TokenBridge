/* SPDX-License-Identifier: MIT */
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";
import "./IOmniBridge.sol";
import "./IWETH.sol";


contract PaymentBridge is Initializable {
    
   using AddressUpgradeable for address;
   
   /// @dev treasury address to send to for non-dai tokens
   address public treasuryAddress;
   
   /// @dev wrapAndZap address for Moloch Daos on xdai
   address public wrapAndZapAddress;

   /// @dev Omnibridge address 
   address public omnnibrigeAddress;

   /// @dev xdaibridge address
   address public xdaibridgeAddress;

   /// @dev dai address
   address public daiAddress;

   /// @dev weth address
   IWETH public weth;

   /// @dev event fired when a new payment bridge is created
   event Payment(address indexed token, address indexed payer, address indexed recipient, uint256 amount);
   function __PaymentBridge_init_unchained(address _treasuryAddress, address _wrapAndZap, address _omnnibrigeAddress, address _xdaibridgeAddress, address _daiAddress, address _wethAddress) internal initializer{
       treasuryAddress = _treasuryAddress;
       wrapAndZapAddress = _wrapAndZap;
       omnnibrigeAddress = _omnnibrigeAddress;
       xdaibridgeAddress = _xdaibridgeAddress;
       daiAddress = _daiAddress;
       weth = IWETH(_wethAddress);
   }

    function __PaymentBridge_init(address _treasuryAddress, address _wrapAndZap, address _omnibridgeAddress, address _xdaibridgeAddress, address _daiAddress, address _weth) internal initializer {
        __PaymentBridge_init_unchained(_treasuryAddress, _wrapAndZap, _omnibridgeAddress, _xdaibridgeAddress, _daiAddress, _weth);
    }

    function initialize(address _treasuryAddress, address _wrapAndZap, address _omnibridgeAddress, address _xdaibridgeAddress, address _daiAddress, address _weth) public {
        __PaymentBridge_init_unchained(_treasuryAddress, _wrapAndZap, _omnibridgeAddress, _xdaibridgeAddress, _daiAddress, _weth);
    }

   // initialize with the below variables
   // - DAO treasury address
   // - wrapnzap address if moloch

   // Two paths
   // - regular erc20 or Eth use omnibridge
   //   - If Eth make sure to wrap it when sending
   // - If xdai use the xdai bridge  
    function pay(uint256 _amount, address tokenAddress) external payable {
        address _recipientAddress = treasuryAddress;
        if (wrapAndZapAddress != address(0)) {
            _recipientAddress = wrapAndZapAddress;
        }

        // token address amount
        // convert to an ERC20 check if DAI
        //
        // Get omnibridge 
        // Get xdai Bridge
        // tell if a n ERC20 is from xDAI
        if (tokenAddress == daiAddress) {
            IOminiBridge(xdaibridgeAddress).relayTokens(tokenAddress, _recipientAddress, _amount);
        } else if (tokenAddress == address(0)) {
            weth.deposit{ value: _amount }();
            IOminiBridge(omnnibrigeAddress).relayTokens(address(weth), _recipientAddress, _amount);
        } else {
            // Does passing the ERC 20 directly work?
            IOminiBridge(omnnibrigeAddress).relayTokens(tokenAddress, _recipientAddress, _amount);
        }
        emit Payment(tokenAddress, msg.sender, _recipientAddress, _amount);
    }
}

// + Setup IWETH stuff
// Set up subgraph
// Deploy to kovan and sokol
// Write tests

