const {cantripsScope} = require("./common");
const {getDeployedContract, selectDeployedContract} = require("../utils/deployments");
const {givenOrInputUntil} = require("../utils/input");


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


cantripsScope.task("erc721:get-token-metadata", "Gets the metadata of a token in an ERC721 contract")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addOptionalParam("tokenId", "The token id (a positive base-10 or base-16 integer)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, forceNonInteractive, tokenId}, hre, runSuper) => {
        try {
            // Get the contract.
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(
                contractId, deploymentId, forceNonInteractive, hre), hre
            );

            // Get the token.
            const tokenId_ = BigInt(await givenOrInputUntil(
                tokenId,
                "0x0", "Token (e.g. 0, 123 or 0x4fa):", (v) => {
                    return /^\d+|0x[a-fA-F0-9]+$/.test(v);
                }, "Invalid token id", forceNonInteractive)
            );

            // Get the token metadata.
            console.log("Metadata: " + (await contract.tokenURI(tokenId_)));
        } catch(e) {
            console.error(
                "Could not get the token metadata. This might happen because of many reasons, e.g. " +
                "the contract does not implement ERC721 properly, or you have a deployment error " +
                "(e.g. an invalid address or corrupted deployment files). Check the error for more " +
                "details:"
            );
            console.error(e);
        }
    });


cantripsScope.task("erc721:get-token-owner", "Gets the owner of a token in an ERC721 contract")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addOptionalParam("tokenId", "The token id (a positive base-10 or base-16 integer)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, forceNonInteractive, tokenId}, hre, runSuper) => {
        try {
            // Get the contract.
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(
                contractId, deploymentId, forceNonInteractive, hre), hre
            );

            // Get the token.
            const tokenId_ = BigInt(await givenOrInputUntil(
                tokenId,
                "0x0", "Token (e.g. 0, 123 or 0x4fa):", (v) => {
                    return /^\d+|0x[a-fA-F0-9]+$/.test(v);
                }, "Invalid token id", forceNonInteractive)
            );

            // Get the token metadata.
            console.log("Owner: " + (await contract.ownerOf(tokenId_)));
        } catch(e) {
            console.error(
                "Could not get the token metadata. This might happen because of many reasons, e.g. " +
                "the contract does not implement ERC721 properly, or you have a deployment error " +
                "(e.g. an invalid address or corrupted deployment files). Check the error for more " +
                "details:"
            );
            console.error(e);
        }
    });


// TODO: Mint token X to address A.
// TODO: Transfer token X to address B.