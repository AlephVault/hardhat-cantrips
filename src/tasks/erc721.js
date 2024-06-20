const {cantripsScope} = require("./common");
const {getDeployedContract, selectDeployedContract} = require("../utils/deployments");
const {givenOrInputUntil} = require("../utils/input");
const {parseAccount, parseSmartAddress} = require("../utils/accounts");


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
            const owner = await contract.ownerOf(tokenId_);
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
                "Could not get the token metadata. This might happen because of many reasons, e.g. " +
                "the contract does not implement ERC721 properly, or you have a deployment error " +
                "(e.g. an invalid address or corrupted deployment files). Check the error for more " +
                "details:"
            );
            console.error(e);
        }
    });


cantripsScope.task("erc721:mint", "Mints, for an account or address, a token in an ERC721 contract")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addOptionalParam("tokenId", "The token id (a positive base-10 or base-16 integer)")
    .addOptionalParam("toAddress", "The index (0 to number of accounts - 1), or address, of the account to send ETH to")
    .addOptionalParam("usingAccount", "The index (0 to number of accounts - 1) of the account to send ETH from")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, forceNonInteractive, tokenId, toAddress, usingAccount}, hre, runSuper) => {
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

            // Get the "from" account and the "to" address.
            const usingAccount_ = await parseAccount(usingAccount || "0", hre);
            const toAddress_ = await parseSmartAddress(await givenOrInputUntil(
                toAddress,
                "0", "Insert target checksum address or account index:", (v) => {
                    return /^(\d+)|(0x[a-fA-F0-9]{40})$/.test(v);
                }, "The value is not a valid address or account index", forceNonInteractive
            ), hre);

            // Get the token metadata.
            await contract.connect(usingAccount_).safeMint(toAddress_, tokenId_);
            console.log(`Minted to ${toAddress_} a token with id ${tokenId_} successfully.`);
        } catch(e) {
            console.error(
                "Could not mint the new token. This might happen because of many reasons, e.g. " +
                "the contract does not implement ERC721 properly, or you have a deployment error " +
                "(e.g. an invalid address or corrupted deployment files). Check the error for more " +
                "details:"
            );
            console.error(e);
        }
    });


cantripsScope.task("erc721:transfer", "Transfers, to an account or address, a token in an ERC721 contract")
    .addOptionalParam("contractId", "A contract id, specified as DeploymentModule#ContractId for the current network")
    .addOptionalParam("deploymentId", "The deployment id to get the contract from (it MUST match the current network)")
    .addOptionalParam("tokenId", "The token id (a positive base-10 or base-16 integer)")
    .addOptionalParam("toAddress", "The index (0 to number of accounts - 1), or address, of the account to send ETH to")
    .addOptionalParam("usingAccount", "The index (0 to number of accounts - 1) of the account to send ETH from")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractId, deploymentId, forceNonInteractive, tokenId, toAddress, usingAccount}, hre, runSuper) => {
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

            // Get the "from" account and the "to" address.
            const usingAccount_ = await parseAccount(usingAccount || "0", hre);
            const toAddress_ = await parseSmartAddress(await givenOrInputUntil(
                toAddress,
                "0", "Insert target checksum address or account index:", (v) => {
                    return /^(\d+)|(0x[a-fA-F0-9]{40})$/.test(v);
                }, "The value is not a valid address or account index", forceNonInteractive
            ), hre);

            // Get the token metadata.
            await contract.connect(usingAccount_).safeTransferFrom(usingAccount_.address, toAddress_, tokenId_);
            console.log(`Transferred from ${usingAccount_.address} to ${toAddress_} a token with id ${tokenId_} successfully.`);
        } catch(e) {
            console.error(
                "Could not transfer the token. This might happen because of many reasons, e.g. " +
                "the contract does not implement ERC721 properly, or you have a deployment error " +
                "(e.g. an invalid address or corrupted deployment files). Check the error for more " +
                "details:"
            );
            console.error(e);
        }
    });
