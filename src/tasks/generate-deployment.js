const {task, scope} = require("hardhat/config");
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
    return inputUntil(contractName, "Give a name to your deployment", (deploymentName) => {
        return /^[A-Za-z][A-Za-z0-9]*$/.test(deploymentName);
    }, "Invalid deployment name.");
}


cantripsScope.task("generate-deployment", "Generates a deployment file for an existing contract")
    .addOptionalParam("contractName", "An optional existing contract name")
    .addOptionalParam("moduleName", "An optional ignition module name")
    .addOptionalParam("reference", "Generates an m.contractAt future to the specified address instead of an m.contract future")
    .addOptionalParam("chainId", "Create this deployment chain-specific for a given chain")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({ contractName, reference, chainId, moduleName, forceNonInteractive }, hre, runSuper) => {
        try {
            contractName = (contractName || "").trim();
            moduleName = (moduleName || "").trim();
            const ignitionPath = path.resolve(hre.config.paths.root, "ignition", "modules");
            await hre.run("compile");
            const contractName_ = await selectContract(contractName, forceNonInteractive, hre);
            const moduleName_ = validateDeploymentName(moduleName) || await inputDeploymentName(contractName_, forceNonInteractive);

            const sourceTemplate = reference ? "ignition/ContractReference.js.template" :
                "ignition/ContractCreation.js.template";
            const parsedChainId = (chainId || 0) && parseChainId(chainId);
            const targetPath = path.resolve(
                ignitionPath, parsedChainId ? `${moduleName_}-${parsedChainId}.js` : `${moduleName_}.js`
            );
            const replacements = {
                MODULE_NAME: moduleName_,
                CONTRACT_NAME: contractName_,
                CONTRACT_ADDRESS: reference && parseAddress(reference, hre)
            }
            applyTemplate(sourceTemplate, replacements, targetPath);
            console.log(`Deployment ${targetPath} successfully created.`);
        } catch(e) {
            console.error(e);
        }
    });