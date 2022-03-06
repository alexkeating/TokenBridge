/* SPDX-License-Identifier: MIT */
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IOmniBridge.sol";
import "./IWETH.sol";


contract PaymentBridge is Initializable {
    using AddressUpgradeable for address;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    /// @dev flag the contract is initialized
    bool public initialized;

    /// @dev treasury address to send to for non-dai tokens
    address public treasuryAddress;
    
    /// @dev wrapAndZap address for Moloch Daos on xdai to send DAI
    address public wrapAndZapAddress;

    /// @dev Omnibridge address used to bridge ERC-20 tokens
    address public omnibridgeAddress;

    /// @dev xdaibridge address used to bridge DAI
    address public xdaibridgeAddress;

    /// @dev dai address on Mainnet
    address public daiAddress;

    /// @dev weth address on mainnet
    IWETH public weth;

    /// @dev event fired when a new payment bridge is created
    event Payment(address indexed token, address indexed payer, address indexed recipient, uint256 amount);

    function __PaymentBridge_init_unchained(address _treasuryAddress, address _wrapAndZap, address _omnibridgeAddress, address _xdaibridgeAddress, address _daiAddress, address _wethAddress) internal initializer{
        require(_treasuryAddress != address(0), "No treasury address specified");
        require(_omnibridgeAddress != address(0), "No omnibridge address specified");
        require(_xdaibridgeAddress != address(0), "No xdaibridge address specified");
        require(_daiAddress != address(0), "No DAI address specified");
        require(_wethAddress != address(0), "No WETH address specified");
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

    // @notice intializes payment bridge with appropriate variables
    function initialize(address _treasuryAddress, address _wrapAndZap, address _omnibridgeAddress, address _xdaibridgeAddress, address _daiAddress, address _weth) public {
        __PaymentBridge_init(_treasuryAddress, _wrapAndZap, _omnibridgeAddress, _xdaibridgeAddress, _daiAddress, _weth);
    }

    // @notice sends payment tokens from mainnet to XDAI
    function pay(uint256 _amount, address _tokenAddress) external payable {
        _pay(_amount, _tokenAddress, msg.sender);
    }  

    // @notice sends payment to payment bridge if payment gets stuck
    function poke(uint256 _amount, address _tokenAddress) external payable {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (balance != 0) {
            _pay(_amount, _tokenAddress, address(this));      
        }
    }

    function _pay(uint256 _amount, address _tokenAddress, address sender) internal {
        address _recipientAddress = treasuryAddress;
        if (wrapAndZapAddress != address(0)) {
            _recipientAddress = wrapAndZapAddress;
        }
        
        if (_tokenAddress == address(0)) {
            require(_amount == msg.value, "msg.value does not equal passed in amount");
            weth.deposit{value: _amount}();
            IOminiBridge(omnibridgeAddress).relayTokens(address(weth), _recipientAddress, _amount);
            emit Payment(_tokenAddress, sender, _recipientAddress, _amount);
            return;
        }

        IERC20Upgradeable _token = IERC20Upgradeable(_tokenAddress);
        if (sender != address(this)) {
            _token.safeTransferFrom(sender, address(this), _amount);
        }
        if (_tokenAddress == daiAddress) {
            _approveBridge(_token, xdaibridgeAddress, _amount);
            IOminiBridge(xdaibridgeAddress).relayTokens(_tokenAddress, _recipientAddress, _amount);
        } else {
            // Does passing the ERC 20 directly work?
            _approveBridge(_token, omnibridgeAddress, _amount);
            IOminiBridge(omnibridgeAddress).relayTokens(_tokenAddress, treasuryAddress, _amount);
        }
        emit Payment(_tokenAddress, sender, _recipientAddress, _amount);
    }


    function _approveBridge(IERC20Upgradeable _token, address _bridge, uint256 _amount) internal {
        _token.safeApprove(_bridge, _amount);
    }

   
    // Sends ETH to XDAI tresury if send directly to the payment bridge
    receive() external payable {
        _pay(msg.value, address(0), address(this));
    }
}