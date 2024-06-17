const {scope} = require("hardhat/config");
const scope_ = scope("cantrips", "Many generators and quick helpers");


/**
 * Requires the ethers.js provider in the environment.
 * @param hre The hardhat runtime environment.
 */
function requireEthersProvider(hre) {
    if (!hre.ethers) {
        throw new Error("This plug-in is only supported for projects using hardhat-ethers");
    }
}


scope_.setAction_ = scope_.setAction
scope_.setAction = (args, hre, ...more) => {
    requireEthersProvider(hre);
    return scope_.setAction(args, hre, ...more);
}


module.exports = {
    cantripsScope: scope_, requireEthersProvider
}