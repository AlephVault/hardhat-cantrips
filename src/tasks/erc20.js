const {cantripsScope} = require("./common");
const {inputUntil} = require("../utils/input");
const {parseSmartAddress, parseAccount} = require("../utils/accounts");
const {getDeployedContract, selectDeployedContract} = require("../utils/deployments");
const {parseAmount} = require("../utils/amounts");


cantripsScope.task("erc20:get-metadata", "Gets the metadata of an ERC20 contract")
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
            console.log("Decimals: " + (await contract.decimals()));
            console.log("Total Supply: " + (await contract.totalSupply()));
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


cantripsScope.task("erc20:get-balance", "Gets the ERC20 balance of an account")
    .addOptionalParam("address", "The index (0 to number of accounts - 1), or address, of the account to get the balance")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({address, contractId, deploymentId, forceNonInteractive}, hre, runSuper) => {
        try {
            // Get the contract.
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(
                contractId, deploymentId, forceNonInteractive, hre), hre
            );

            // Get the address to query balance from.
            const address_ = await parseSmartAddress(address || await inputUntil(
                "0", "Insert checksum address or account index:", (v) => {
                    return /^(\d+)|(0x[a-fA-F0-9]{40})$/.test(v);
                }, "The value is not a valid address or account index",
                forceNonInteractive
            ), hre);

            // Perform the query.
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


cantripsScope.task("erc20:transfer", "Transfers an amount of tokens to another account or address")
    .addOptionalParam("amount", "The amount to send, e.g. 1eth, 2.5eth or 3000000000000000000")
    .addOptionalParam("toAddress", "The index (0 to number of accounts - 1), or address, of the account to send ETH to")
    .addOptionalParam("usingAccount", "The index (0 to number of accounts - 1) of the account to send ETH from")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, forceNonInteractive, usingAccount, toAddress, amount}, hre, runSuper) => {
        try {
            // Get the contract.
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(
                contractId, deploymentId, forceNonInteractive, hre), hre
            );

            // Get the transfer parameters.
            const usingAccount_ = await parseAccount(usingAccount || "0", hre);
            const toAddress_ = await parseSmartAddress(toAddress || await inputUntil(
                "0", "Insert checksum address or account index:", (v) => {
                    return /^(\d+)|(0x[a-fA-F0-9]{40})$/.test(v);
                }, "The value is not a valid address or account index", forceNonInteractive
            ), hre);
            const amount_ = parseAmount(amount || await inputUntil(
                "1eth", "Insert amount (e.g. 1500000000000000000 or 1.5eth)", (v) => {
                    return /^(\d+(\.\d+)?)\s*eth$/i.test(v.trim());
                }, "The given amount is not valid", forceNonInteractive
            ), hre);

            // Perform the transfer.
            await contract.connect(usingAccount_).transfer(toAddress_, amount_);
        } catch(e) {
            console.error(
                "Could not transfer the tokens. This might happen because of many reasons, e.g. " +
                "the contract does not implement ERC20 properly, or you have a deployment error " +
                "(e.g. an invalid address or corrupted deployment files). Check the error for more " +
                "details:"
            )
            console.error(e);
        }
    });
