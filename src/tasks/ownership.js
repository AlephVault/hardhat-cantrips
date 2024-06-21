const {cantripsScope} = require("./common");
const {givenOrInputUntil} = require("../utils/input");
const {parseSmartAddress, parseAccount} = require("../utils/accounts");
const {getDeployedContract, selectDeployedContract} = require("../utils/deployments");


cantripsScope.task("transfer-ownership", "Transfers the ownership of a deployed contract to another account or address")
    .addOptionalParam("toAddress", "The index (0 to number of accounts - 1), or address, of the account to transfer the ownership to")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addOptionalParam("usingAccount", "The index (0 to number of accounts - 1) of the account to transfer the ownership with")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({usingAccount, toAddress, contractId, deploymentId, forceNonInteractive}, hre, runSuper) => {
        try {
            const usingAccount_ = await parseAccount(usingAccount || "0", hre);
            const toAddress_ = await parseSmartAddress(await givenOrInputUntil(
                toAddress,
                "0", "Insert checksum address or account index:", (v) => {
                    return /^(\d+)|(0x[a-fA-F0-9]{40})$/.test(v);
                }, "The value is not a valid address or account index",
                forceNonInteractive
            ), hre);
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(contractId, deploymentId, forceNonInteractive, hre), hre);
            const connected = contract.connect(usingAccount_);
            await connected.transferOwnership(toAddress_);
            console.log("The contract was successfully transferred to the new address: " + toAddress_);
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
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, forceNonInteractive}, hre, runSuper) => {
        try {
            const contract = await getDeployedContract(deploymentId, await selectDeployedContract(contractId, deploymentId, forceNonInteractive, hre), hre);
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
