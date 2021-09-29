/* SPDX-License-Identifier: MIT */
pragma solidity 0.8.6;

interface IWETH {
    function deposit() external payable;

    function withdraw(uint256 _value) external;

    function approve(address _to, uint256 _value) external;
}