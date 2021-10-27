/* SPDX-License-Identifier: MIT */
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IOmniBridge.sol";
import "./IWETH.sol";
import "hardhat/console.sol";


contract PaymentBridge is Initializable {
    using AddressUpgradeable for address;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    /// @dev flag the contract as initialized
    bool public initialized;

    /// @dev treasury address to send to for non-dai tokens
    address public treasuryAddress;
    
    /// @dev wrapAndZap address for Moloch Daos on xdai
    address public wrapAndZapAddress;

    /// @dev Omnibridge address 
    address public omnibridgeAddress;

    /// @dev xdaibridge address
    address public xdaibridgeAddress;

    /// @dev dai address
    address public daiAddress;

    /// @dev weth address
    IWETH public weth;

    /// @dev event fired when a new payment bridge is created
    event Payment(address indexed token, address indexed payer, address indexed recipient, uint256 amount);

    function __PaymentBridge_init_unchained(address _treasuryAddress, address _wrapAndZap, address _omnibridgeAddress, address _xdaibridgeAddress, address _daiAddress, address _wethAddress) internal initializer{
        treasuryAddress = _treasuryAddress;
        wrapAndZapAddress = _wrapAndZap;
        omnibridgeAddress = _omnibridgeAddress;
        xdaibridgeAddress = _xdaibridgeAddress;
        daiAddress = _daiAddress;
        weth = IWETH(_wethAddress);
        weth.approve(omnibridgeAddress, type(uint256).max);
        initialized = true;
    }

    function __PaymentBridge_init(address _treasuryAddress, address _wrapAndZap, address _omnibridgeAddress, address _xdaibridgeAddress, address _daiAddress, address _weth) internal initializer {
        __PaymentBridge_init_unchained(_treasuryAddress, _wrapAndZap, _omnibridgeAddress, _xdaibridgeAddress, _daiAddress, _weth);
    }

    function initialize(address _treasuryAddress, address _wrapAndZap, address _omnibridgeAddress, address _xdaibridgeAddress, address _daiAddress, address _weth) public {
        __PaymentBridge_init_unchained(_treasuryAddress, _wrapAndZap, _omnibridgeAddress, _xdaibridgeAddress, _daiAddress, _weth);
    }

    function pay(uint256 _amount, address _tokenAddress) external payable {
        _pay(_amount, _tokenAddress);
    }  

    function poke(uint256 _amount, address _tokenAddress) external payable {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (balance != 0) {
            _pay(_amount, _tokenAddress);      
        }
    }

    function _pay(uint256 _amount, address _tokenAddress) internal {
        console.log("Here");
        console.log(_tokenAddress);
        address _recipientAddress = treasuryAddress;
        if (wrapAndZapAddress != address(0)) {
            _recipientAddress = wrapAndZapAddress;
        }
        
        if (_tokenAddress == address(0)) {
            console.log("Here");
            console.log(address(weth));
            weth.deposit{ value: _amount }();
            IOminiBridge(omnibridgeAddress).relayTokens(address(weth), _recipientAddress, _amount);
            emit Payment(_tokenAddress, msg.sender, _recipientAddress, _amount);
            return;
        }

        IERC20Upgradeable _token = IERC20Upgradeable(_tokenAddress);
        if (msg.sender != address(this)) {
            _token.safeTransferFrom(msg.sender, address(this), _amount);
        }
        if (_tokenAddress == daiAddress) {
            _approveBridge(_token, xdaibridgeAddress, _amount);
            IOminiBridge(xdaibridgeAddress).relayTokens(_tokenAddress, _recipientAddress, _amount);
        } else {
            // Does passing the ERC 20 directly work?
            _approveBridge(_token, omnibridgeAddress, _amount);
            IOminiBridge(omnibridgeAddress).relayTokens(_tokenAddress, _recipientAddress, _amount);
        }
        emit Payment(_tokenAddress, msg.sender, _recipientAddress, _amount);
    }


    function _approveBridge(IERC20Upgradeable _token, address _bridge, uint256 _amount) internal {
         if (_token.allowance(address(this), _bridge) == 0) {
             _token.safeApprove(_bridge, _amount);
             return;
         }
         if (_token.allowance(address(this), _bridge) < _amount) {
             _token.safeIncreaseAllowance(_bridge, _amount);
             return;
        } 
    }

    receive() external payable {
        _pay(msg.value, address(0));
    }
}