const {cantripsScope} = require("./common");
const {inputUntil} = require("../utils/input");
const {parseSmartAddress, parseAccount} = require("../utils/accounts");
const {getDeployedContract, selectDeployedContract} = require("../utils/deployments");


cantripsScope.task("get-balance", "Gets the ERC20 balance of an account")
    .addOptionalParam("address", "The index (0 to number of accounts - 1), or address, of the account to get the balance")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({address, contractId, deploymentId, forceNonInteractive}, hre, runSuper) => {
        try {
            const address_ = await parseSmartAddress(address || await inputUntil(
                "0", "Insert checksum address or account index:", (v) => {
                    return /^(\d+)|(0x[a-fA-F0-9]{40})$/.test(v);
                }, "The value is not a valid address or account index",
                forceNonInteractive
            ), hre);
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(
                contractId, deploymentId, forceNonInteractive, hre), hre
            );
            const balance = await contract.balanceOf(address_);
            console.log(`The balance for ${address_} is: ${balance}`);
        } catch(e) {
            console.error(
                "Could not get the balance for the given account. This might happen because of " +
                "many reasons, e.g. the contract does not implement ERC20 properly, or you have " +
                "a deployment error (e.g. an invalid address or corrupted deployment files). " +
                "Check the error for more details:"
            );
            console.error(e);
        }
    });


cantripsScope.task("get-metadata", "Gets the metadata of an ERC20 contract")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, forceNonInteractive}, hre, runSuper) => {
        try {
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(
                contractId, deploymentId, forceNonInteractive, hre), hre
            );
            console.log("Name: " + (await contract.name()));
            console.log("Symbol: " + (await contract.symbol()));
            console.log("Decimals: " + (await contract.decimals()));
        } catch(e) {
            console.error(
                "Could not get the metadata. This might happen because of many reasons, e.g. " +
                "the contract does not implement ERC20 properly, or you have a deployment error " +
                "(e.g. an invalid address or corrupted deployment files). Check the error for more " +
                "details:"
            );
            console.error(e);
        }
    });
