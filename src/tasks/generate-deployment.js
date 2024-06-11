const {task, scope} = require("hardhat/config");
const {applyTemplate} = require("../utils/templates");
const enquirer = require("enquirer");
const path = require("path");
const fs = require("fs");
const {cantripsScope} = require("./common");
const {inputUntil} = require("../utils/input");
const {collectContractNames} = require("../utils/contracts");


async function selectContract(hre) {
    const contractNames = collectContractNames(hre);

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

    let prompt = new enquirer.Select({
        name: "contractType",
        message: "Select a contract to deploy:",
        choices
    });
    return await prompt.run();
}


function inputDeploymentName(contractName) {
    return inputUntil(contractName, "Give a name to your deployment", (deploymentName) => {
        return /[A-Za-z][A-Za-z0-9]*/.test(deploymentName);
    }, "Invalid deployment name.");
}


cantripsScope.task("generate-deployment", "Generates a deployment file for an existing contract")
    .addOptionalParam("reference", "Generates an m.contractAt future to the specified address instead of an m.contract future")
    .addOptionalParam("chainId", "Whether to create this deployment chain-specific")
    .addOptionalParam("address")
    .setAction(async ({ reference, chainId }, hre, runSuper) => {
        try {
            const ignitionPath = path.resolve(hre.config.paths.root, "ignition", "modules");
            await hre.run("compile");
            const contractName = await selectContract(hre);
            const deploymentName = await inputDeploymentName(contractName);

            const sourceTemplate = reference ? "ignition/ContractReference.js.template" :
                "ignition/ContractCreation.js.template";
            const targetPath = path.resolve(ignitionPath, `${deploymentName}.js`);
            const replacements = {
                MODULE_NAME: deploymentName,
                CONTRACT_NAME: contractName,
                CONTRACT_ADDRESS: validateAddress(reference)
            }
            applyTemplate(sourceTemplate, replacements, targetPath);
            console.log(`Deployment ${targetPath} successfully created.`);
        } catch(e) {
            console.error(e);
        }
    });