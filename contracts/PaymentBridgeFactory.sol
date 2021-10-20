/* SPDX-License-Identifier: MIT */
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./PaymentBridge.sol";

// Setup fee amount
// Allow owner to modify fee amount
// transfer fee amount when creating bridge

contract PaymentBridgeFactory is Initializable {
    using AddressUpgradeable for address;
    using ClonesUpgradeable for address;
    // Methods
    /// @dev fixed contract template for EIP-1167 Proxy pattern
    address public template;
    /// @dev address to send payment for creating a new bridge
    address payable public payeeBridge;
    /// @dev fee amount to charge for every new bridge
    uint256 public feeAmount;

    /// @dev event fired when a new payment bridge is created
    event NewPaymentBridge(address indexed bridgeOwner, address indexed bridge);

    // init unchained
    /// @dev used to handle multiple inheritance in order to prevent
    /// calling parent intializers
    function __PaymentBridgeFactory_init_unchained(address _template, address _payeeBridge, uint256 _feeAmount) internal initializer {
        template = _template;
        payeeBridge = payable(_payeeBridge);
        feeAmount = _feeAmount;
    }
    // init
    // @dev embeds linearized calls to all parent initializers
    function __PaymentBridgeFactory_init(address _template, address _payeeBridge, uint256 _feeAmount) internal initializer {
        __PaymentBridgeFactory_init_unchained(_template, _payeeBridge, _feeAmount);
    }
    // initialize
    /// @dev Initializes factory contract using a minimal proxy pattern (EIP-1167)
    function initialize(address _template, address _payeeBridge, uint256 _feeAmount) public{
        __PaymentBridgeFactory_init(_template, _payeeBridge, _feeAmount);
    }

    
    // _initAndEmit - will house payment logic
    function _initAndEmit(address _instance, address sender, bytes calldata _initData) private {
        emit NewPaymentBridge(sender, _instance);
        if (_initData.length > 0) {
            _instance.functionCall(_initData);
        }
        // PaymentBridge bridge = PaymentBridge(_instance);
        // require(bridge.initialized(), "PaymentBridgeFactory: is not initialized");
    }

    function changeFee(uint256 _feeAmount) external {
        // TODO: fee should be set in USD, then converted used currency when createPaymentBridge is called
        // TODO: check if sender is owner
        // require(msg.sender == <gnosis address>, "PaymentBridgeFactory: Sender is not the admin");
        feeAmount = _feeAmount;
    }


    // clone
    function clone(bytes calldata _initData) internal {
        address sender = msg.sender;
        _initAndEmit(template.clone(), sender, _initData);
    }

    // create payment bridge
    function createPaymentBridge(bytes calldata _initData) external payable {
        require(template != address(0), "PaymentBridgeFactory: Missing PaymentBridge Template");
        // send money to payment bridge
        // TODO: does there need to be an approval above this
        PaymentBridge(payeeBridge).pay(feeAmount, address(0));
        clone(_initData);
    }
    // totalBridges
    // bridges owned by

    // Event
    //
    // New Bridge

    // _gap
    // This is empty reserved space in storage that is put in place in Upgradeable contracts.
    // It allows us to freely add new state variables in the future without compromising the
    // storage compatibility with existing deployments
    // The size of the __gap array is calculated so that the amount of storage used by a contract
    // always adds up to the same number
    uint256[47] private __gap;

}
