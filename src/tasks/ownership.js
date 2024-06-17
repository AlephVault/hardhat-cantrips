const {applyTemplate} = require("../utils/templates");
const enquirer = require("enquirer");
const path = require("path");
const {cantripsScope, inputUntil} = require("./common");
const {parseSmartAddress, parseAccount} = require("../utils/accounts");
const {parseAmount} = require("../utils/amounts");
const {getDeployedContract} = require("../utils/deployments");


cantripsScope.task("transfer-ownership", "Transfers the ownership of a deployed contract to another account or address")
    .addPositionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addPositionalParam("toAccount", "The index (0 to number of accounts - 1), or address, of the account to send ETH to")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addOptionalParam("usingAccount", "The index (0 to number of accounts - 1) of the account to send ETH from")
    .setAction(async ({ usingAccount, toAccount, contractId, deploymentId }, hre, runSuper) => {
        try {
            const usingAccount_ = await parseAccount(usingAccount || "0", hre);
            const toAddress = await parseSmartAddress(toAccount, hre);
            const contract = await getDeployedContract(deploymentId, contractId, hre);
            const connected = contract.connect(usingAccount_);
            await connected.transferOwnership(toAddress);
            console.log("The contract was successfully transferred to the new address: " + toAddress);
        } catch(e) {
            console.error(
                "Could not transfer the contract's ownership. This might happen because of many " +
                "reasons, e.g. the contract does not implement transferOwnership(address) like " +
                "an OpenZeppelin's Ownable one does, or you have a transaction error (e.g. not " +
                "using the owner account in --from-account, or not having such account among " +
                "your accounts). Check the error for more details:"
            );
            console.error(e);
        }
    });


cantripsScope.task("get-ownership", "Gets the ownership of a deployed contract")
    .addPositionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .setAction(async ({ contractId, deploymentId }, hre, runSuper) => {
        try {
            const contract = await getDeployedContract(deploymentId, contractId, hre);
            const owner = await contract.owner();
            const signers = await hre.ethers.getSigners();
            const signerIndex = signers.findIndex((e) => {
                return e.address === owner;
            })
            if (signerIndex >= 0) {
                console.log(`Owner: ${owner} (account index: ${signerIndex})`);
            } else {
                console.log(`Owner: ${owner} (not an account in the current settings)`);
            }
        } catch(e) {
            console.error(
                "Could not get the contract's ownership. This might happen because of many " +
                "reasons, e.g. the contract does not implement transferOwnership(address) like " +
                "an OpenZeppelin's Ownable one does. Check the error for more details:"
            );
            console.error(e);
        }
    });
