const {cantripsScope} = require("./common");
const {getDeployedContract, selectDeployedContract} = require("../utils/deployments");


cantripsScope.task("erc721:get-metadata", "Gets the metadata of an ERC721 contract")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, forceNonInteractive}, hre, runSuper) => {
        try {
            // Get the contract.
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(
                contractId, deploymentId, forceNonInteractive, hre), hre
            );

            // Get the metadata.
            console.log("Name: " + (await contract.name()));
            console.log("Symbol: " + (await contract.symbol()));
        } catch(e) {
            console.error(
                "Could not get the metadata. This might happen because of many reasons, e.g. " +
                "the contract does not implement ERC721 properly, or you have a deployment error " +
                "(e.g. an invalid address or corrupted deployment files). Check the error for more " +
                "details:"
            );
            console.error(e);
        }
    });
