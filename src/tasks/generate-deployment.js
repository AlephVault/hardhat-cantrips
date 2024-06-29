const {applyTemplate} = require("../utils/templates");
const enquirer = require("enquirer");
const path = require("path");
const fs = require("fs");
const {cantripsScope} = require("./common");
const {inputUntil} = require("../utils/input");
const {collectContractNames} = require("../utils/contracts");
const {parseAddress} = require("../utils/accounts");
const {checkNotInteractive} = require("../utils/common");


/**
 * Selects a contract to generate its module (or keeps the provided one if it is valid).
 * @param contractName The initial (and perhaps to keep) contract name. If not valid,
 * this command tries to become interactive and pick one of the available contracts.
 * @param forceNonInteractive If true, raises an error when the command tries
 * to become interactive.
 * @returns {Promise<*|string>} The chosen contract (async function).
 */
async function selectContract(contractName, forceNonInteractive, hre) {
    const contractNames = collectContractNames(hre);
    if (contractNames.find(({name}) => name === contractName)) {
        return contractName;
    }

    let uniqueChoices = [];
    let repeatedChoices = [];
    contractNames.forEach(({name, path}) => {
        if (uniqueChoices.indexOf(name) >= 0) {
            if (repeatedChoices.indexOf(name) < 0) {
                console.warn(
                    `The name '${name}' seems to be repeated. While the deployment ` +
                    `script can be generated, it will indeed raise an error on execution ` +
                    `due to the conflicting artifact name. While future ignition versions ` +
                    `might support this (by specifying full artifact paths), as of today ` +
                    `it is not. So it will not be included in the list of available options.`
                );
                repeatedChoices.push(name);
            }
        } else {
            uniqueChoices.push(name);
        }
    });

    const choices = contractNames.filter(({name}) => {
        return repeatedChoices.indexOf(name) < 0;
    }).map(({name, path}) => {
        return {name: name, message: `${name} (artifact: artifacts/contracts/${path})`};
    });

    checkNotInteractive(forceNonInteractive);
    let prompt = new enquirer.Select({
        name: "contractType",
        message: "Select a contract to deploy:",
        choices
    });
    return await prompt.run();
}


/**
 * Validates the deployment name to be a valid Solidity contract name.
 * @param deploymentName The contract name.
 * @returns {*|string} Either the same contract name or, if not valid, "".
 */
function validateDeploymentName(deploymentName) {
    return /^[A-Za-z][A-Za-z0-9]*$/.test(deploymentName) ? deploymentName : ""
}


/**
 * Prompts the user to write a valid deployment name.
 * @param contractName The contract name.
 * @param forceNonInteractive If true, raises an error since this command tries
 * to become interactive.
 * @returns {Promise<*|undefined>} The contract name (async function).
 */
function inputDeploymentName(contractName, forceNonInteractive) {
    checkNotInteractive(forceNonInteractive);
    return inputUntil(contractName, "Give a name to your deployment:", (deploymentName) => {
        return /^[A-Za-z][A-Za-z0-9]*$/.test(deploymentName);
    }, "Invalid deployment name.");
}


/**
 * Validates the scopeType option.
 * @param scopeType The scope type.
 * @returns {*|string} Either the same scope type or "" if it is not valid.
 */
function validateScopeType(scopeType) {
    if (scopeType === "specific" || scopeType === "default") {
        return scopeType;
    } else {
        return "";
    }
}


/**
 * Selects a scope type for a deployment.
 * @param network The network (the current one).
 * @param forceNonInteractive Whether to raise an error in this interactive method.
 * @returns {Promise<*>} The scope type (async function).
 */
async function selectScopeType(network, forceNonInteractive) {
    checkNotInteractive(forceNonInteractive);
    let prompt = new enquirer.Select({
        name: "scopeType",
        message: "What's this deployment intended for?",
        choices: [
            {name: "specific", message: "A chain-specific deployment for the network: " + network},
            {name: "default", message: "A general/default deployment"}
        ]
    });
    return await prompt.run();
}


cantripsScope.task("generate-deployment", "Generates a deployment file for an existing contract")
    .addOptionalParam("contractName", "An optional existing contract name")
    .addOptionalParam("moduleName", "An optional ignition module name")
    .addOptionalParam("reference", "Tells the reference type, which can either be a new contract (new) or referencing an existing contract (an address)")
    .addOptionalParam("scopeType", "Whether it is intended for the given --network (specific) or for the general case (default)")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({contractName, reference, scopeType, moduleName, forceNonInteractive}, hre, runSuper) => {
        try {
            contractName = (contractName || "").trim();
            moduleName = (moduleName || "").trim();
            reference = (reference || "").trim();
            scopeType = (scopeType || "").trim();
            const ignitionPath = path.resolve(hre.config.paths.root, "ignition", "modules");
            await hre.run("compile");
            const contractName_ = await selectContract(contractName, forceNonInteractive, hre);
            const moduleName_ = validateDeploymentName(moduleName) || await inputDeploymentName(contractName_, forceNonInteractive);
            const chainId = (await hre.ethers.provider.getNetwork()).chainId;
            scopeType = validateScopeType(scopeType) || await selectScopeType(hre.network.name, forceNonInteractive);
            if (reference !== "new" && !/^0x[a-fA-F0-9]{40}$/.test(reference)) {
                if (scopeType === "default") {
                    reference = "new";
                } else {
                    reference = await inputUntil(
                        "", "Enter the existing contract's address:", (v) => {
                            return /^0x[a-fA-F0-9]{40}$/.test(v);
                        }, "Invalid address", forceNonInteractive
                    );
                }
            }
            const sourceTemplate = reference !== "new" ? "ignition/ContractReference.js.template" :
                "ignition/ContractCreation.js.template";
            const targetPath = path.resolve(
                ignitionPath, scopeType === "specific" ? `${moduleName_}-${chainId}.js` : `${moduleName_}.js`
            );
            const replacements = {
                MODULE_NAME: moduleName_,
                CONTRACT_NAME: contractName_,
                CONTRACT_ADDRESS: reference !== "new" ? reference : ""
            }
            applyTemplate(sourceTemplate, replacements, targetPath);
            console.log(`Deployment ${targetPath} successfully created.`);
        } catch(e) {
            console.error(e);
        }
    });