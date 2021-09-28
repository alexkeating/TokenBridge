/* SPDX-License-Identifier: MIT */
pragma solidity 0.8.6;

interface IOminiBridge {

   function relayTokens(
        address _token,
        address _receiver,
        uint256 _value
   ) external;        

}