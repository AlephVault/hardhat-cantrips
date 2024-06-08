const fs = require("fs");
const path = require("path");
const {traverseDirectory} = require("./common");


/**
 * Collects all the contract names from the compiled artifacts.
 * @param hre The hardhat runtime environment.
 * @returns {*[]} The list of contract names.
 */
function collectContractNames(hre) {
    let contractNames = [];

    let stat = fs.statSync(path.resolve(hre.config.paths.artifacts, "contracts"));
    if (stat.isDirectory()) {
        traverseDirectory(path.resolve(hre.config.paths.artifacts, "contracts"), (subPath, filename) => {
            if (filename.endsWith('.json') && !filename.endsWith('.dbg.json')) {
                const contractName = path.basename(filename, '.json');
                contractNames.push(contractName);
            }
        });
    }

    return contractNames;
}


module.exports = {
    collectContractNames
}