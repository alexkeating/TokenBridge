
// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

// import "@openzeppelin/contracts-upgradeable/presets/ERC20PresetMinterPauserUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract OmniBridgeMock {
    address public token;
    address public receiver;
    uint256 public value;

    function relayTokens(address _token, address _receiver, uint256 _value) external {
        token = _token;
        receiver = _receiver;
        value = _value;
    }
}