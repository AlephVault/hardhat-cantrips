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
    let prompt = new enquirer.Select({
        name: "contractType",
        message: "Select a contract to deploy:",
        choices: contractNames
    });
    return await prompt.run();
}


function inputDeploymentName(contractName) {
    return inputUntil(contractName, "Give a name to your deployment", (deploymentName) => {
        return /[A-Za-z][A-Za-z0-9]*/.test(deploymentName);
    }, "Invalid deployment name.");
}


cantripsScope.task("generate-deployment", "Generates a deployment file for an existing contract")
    .setAction(async ({}, hre, runSuper) => {
        try {
            const ignitionPath = path.resolve(hre.config.paths.root, "ignition", "modules");
            await hre.run("compile");
            const contractName = await selectContract(hre);
            const deploymentName = await inputDeploymentName(contractName);
            const sourceTemplate = `ignition/Simple.js.template`;
            const targetPath = path.resolve(ignitionPath, `${deploymentName}.js`);
            const replacements = {
                MODULE_NAME: deploymentName,
                CONTRACT_NAME: contractName
            }
            applyTemplate(sourceTemplate, replacements, targetPath);
            console.log(`Deployment ${targetPath} successfully created.`);
        } catch(e) {
            console.error(e);
        }
    });