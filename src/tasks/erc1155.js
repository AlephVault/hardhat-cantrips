const {cantripsScope} = require("./common");
const {getDeployedContract, selectDeployedContract} = require("../utils/deployments");
const {parseSmartAddress} = require("../utils/accounts");
const {givenOrInputUntil} = require("../utils/input");


cantripsScope.task("erc1155:get-balance", "Gets the ERC1155 balance of an account and a token")
    .addOptionalParam("address", "The index (0 to number of accounts - 1), or address, of the account to get the balance")
    .addOptionalParam("tokenId", "The token id (a positive base-10 or base-16 integer)")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({address, contractId, deploymentId, tokenId, forceNonInteractive}, hre, runSuper) => {
        try {
            // Get the contract.
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(
                contractId, deploymentId, forceNonInteractive, hre), hre
            );

            // Get the address to query balance from.
            const address_ = await parseSmartAddress(await givenOrInputUntil(
                address,
                "0", "Insert checksum address or account index:", (v) => {
                    return /^(\d+)|(0x[a-fA-F0-9]{40})$/.test(v);
                }, "The value is not a valid address or account index",
                forceNonInteractive
            ), hre);

            // Get the token.
            const tokenId_ = BigInt(await givenOrInputUntil(
                tokenId,
                "0x0", "Token (e.g. 0, 123 or 0x4fa):", (v) => {
                    return /^\d+|0x[a-fA-F0-9]+$/.test(v);
                }, "Invalid token id", forceNonInteractive)
            );

            // Perform the query.
            const balance = await contract.balanceOf(address_, tokenId_);
            console.log(`The balance for ${address_} is: ${balance}`);
        } catch(e) {
            console.error(
                "Could not get the balance for the given account and token. This might happen " +
                "because of many reasons, e.g. the contract does not implement ERC1155 properly, " +
                "or you have a deployment error (e.g. an invalid address or corrupted deployment " +
                "files). Check the error for more details:"
            );
            console.error(e);
        }
    });


cantripsScope.task("erc1155:get-token-metadata", "Gets the ERC1155 balance of an account and a token")
    .addOptionalParam("tokenId", "The token id (a positive base-10 or base-16 integer)")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, tokenId, forceNonInteractive}, hre, runSuper) => {
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

            // Perform the query.
            console.log("Metadata: " + (await contract.uri(tokenId_)));
        } catch(e) {
            console.error(
                "Could not get the balance for the given account and token. This might happen " +
                "because of many reasons, e.g. the contract does not implement ERC1155 properly, " +
                "or you have a deployment error (e.g. an invalid address or corrupted deployment " +
                "files). Check the error for more details:"
            );
            console.error(e);
        }
    });
