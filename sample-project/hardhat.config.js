require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");
require("..");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // THIS SETTING OF SOLIDITY IS THE MOST IMPORTANT THING
  // IN OUR PROJECT(S) SINCE OTHERWISE NO OPTIMIZER IS IN
  // USE AND THE CHAINLINK CONTRACTS WILL FAIL ON BUILD.
  //
  // Alternatively, you can have Hardhat to use a modern
  // version (e.g. 0.8.24) and reserve 0.8.19 (the lowest
  // version to use with Chainlink contracts) to use the
  // optimizer settings, so you don't lose stacktraces in
  // the other contracts when debugging them.
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            details: {
              yulDetails: {
                optimizerSteps: "u"
              }
            }
          }
        }
      }
    ]
  }
};
