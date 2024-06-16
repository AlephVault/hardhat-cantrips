const fs = require("fs");
const {getProjectPrefix, removeProjectPrefix, normalizeByProjectPrefix, traverseDirectory} = require("./common");
const path = require("path");


/**
 * Collects all the contract ids from the deployments in the current network.
 * @param hre The hardhat runtime environment.
 * @returns {*[]} The list of contract names.
 */
function collectDeploymentContractIds(hre) {
    let contractNames = [];

    let stat = fs.statSync(path.resolve(hre.config.paths.artifacts, "contracts"));
    if (stat.isDirectory()) {
        traverseDirectory(path.resolve(hre.config.paths.artifacts, "contracts"), (subPath, filename) => {
            if (filename.endsWith('.json') && !filename.endsWith('.dbg.json')) {
                const contractName = path.basename(filename, '.json');
                contractNames.push(contractName);
            }
        });
    }

    return contractNames;
}


/**
 * Resets the deployment directory.
 * @param deploymentId The deployment id (if false-like, will fall back to chain-{chainId}).
 * @param hre The hardhat runtime environment.
 * @returns {Promise<void>} Nothing (async function).
 */
async function resetDeployments(deploymentId, hre) {
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    const deploymentDir = path.resolve(
        hre.config.paths.root, "ignition", 'deployments', deploymentId || `chain-${chainId}`
    );
    try {
        fs.rmdirSync(deploymentDir, { recursive: true });
    } catch {
        try {
            fs.rmSync(deploymentDir, { recursive: true });
        } catch {}
    }
}


/**
 * Loads the deploy-everything settings from the ignition/deploy-everything.json
 * file (this file must be maintained and committed).
 * @param hre The hardhat runtime environment.
 * @returns {{contents: Array}} The deploy-everything settings.
 */
function loadDeployEverythingSettings(hre) {
    // Determine the path to the deploy-everything file.
    const root = getProjectPrefix(hre) + "/";
    const file = path.resolve(root, "ignition", "deploy-everything.json");

    // Load it.
    try {
        const content = fs.readFileSync(file, {encoding: 'utf8'});
        return JSON.parse(content);
    } catch(e) {
        return {contents: []};
    }
}


/**
 * Saves the deploy-everything settings into the ignition/deploy-everything.json
 * file (this file must be maintained and committed).
 * @param settings The deploy-everything settings.
 * @param hre The hardhat runtime environment.
 */
function saveDeployEverythingSettings(settings, hre) {
    // Determine the path to the deploy-everything file.
    const root = getProjectPrefix(hre);
    const file = path.resolve(root, "ignition", "deploy-everything.json");

    // Save it.
    fs.writeFileSync(file, JSON.stringify(settings), {encoding: 'utf8'});
}


/**
 * Adds a module to the deploy-everything settings (loads it before and saves
 * it after).
 * @param file The module file being added.
 * @param external Whether it is externally imported or not.
 * @param hre The hardhat runtime environment.
 */
function addDeployEverythingModule(file, external, hre) {
    external = !!external;
    let module = "";
    if (external) {
        // External files are taken as-is. They must not start with / and
        // must succeed importing.
        if (file.startsWith("/")) {
            throw new Error(`The module starts with / (this is forbidden): ${file}.`);
        }
        // External files must succeed importing.
        try {
            require(file);
        } catch(e) {
            throw new Error(`Could not require() the external file: ${file}.`)
        }
        // Assign the module directly.
        module = file;
    }
    else
    {
        // Internal files must belong to the project after normalization.
        const normalized = normalizeByProjectPrefix(file, hre);
        if (!normalized.stripped) {
            throw new Error(`The module does not belong to the project: ${file}`);
        }
        // Internal files must succeed importing.
        try {
            require(getProjectPrefix(hre) + "/" + normalized.file);
        } catch(e) {
            throw new Error(`Could not require() the project file: ${file}.`)
        }
        // Assign the module from the normalized path.
        module = normalized.file;
    }

    // Load, check absence, append, and save.
    let settings = loadDeployEverythingSettings(hre);
    settings.contents ||= [];
    if (!!settings.contents.find((e) => {
        return e.filename === module && e.external === external;
    })) throw new Error(`The module is already added to the full deployment: ${file}.`);
    settings.contents = [...settings.contents, {filename: module, external: external}];
    saveDeployEverythingSettings(settings, hre);
}


/**
 * Removes a module to the deploy-everything settings.
 * @param file The module file being removed.
 * @param external Whether the entry to remove is externally imported or not.
 * @param hre The hardhat runtime environment.
 */
function removeDeployEverythingModule(file, external, hre) {
    external = !!external;
    let module = external ? file : normalizeByProjectPrefix(file, hre).file;

    // Load, check presence, remove, and save.
    let settings = loadDeployEverythingSettings(hre);
    settings.contents ||= [];
    let element = settings.contents.find((e) => {
        return e.filename === module && e.external === !!external;
    });
    if (!element) throw new Error(`The module is not added to the full deployment: ${file}.`);
    settings.contents = settings.contents.filter((e) => e !== element);
    saveDeployEverythingSettings(settings, hre);
}


/**
 * Lists all the added modules.
 * @param hre The hardhat runtime environment.
 * @return {Array} The contents of the deployment.
 */
function listDeployEverythingModules(hre) {
    return loadDeployEverythingSettings(hre).contents;
}


/**
 * Adds a chainId to the name of a JS or TS file.
 * @param filename The file.
 * @param chainId The chain id.
 * @returns {string} The new file.
 */
function addChainId(filename, chainId) {
    const parts = filename.split('.');
    const extension = parts.pop();
    return `${parts.join('.')}-${chainId}.${extension}`;
}


/**
 * Imports a module (either externally or locally).
 * @param filename The name of the file to load.
 * @param external Whether it is external or not.
 * @param chainId The chain id.
 * @param hre The hardhat runtime environment.
 * @returns {*} The loaded ignition module.
 */
function importModule(filename, external, chainId, hre) {
    try {
        return external
            ? require(addChainId(filename, chainId))
            : require(addChainId(path.resolve(hre.config.paths.root, filename), chainId));
    } catch {
        // Nothing here. Continue with the general load.
    }

    try {
        return external
            ? require(filename)
            : require(path.resolve(hre.config.paths.root, filename));
    } catch(e) {
        throw new Error(`Could not import the ${external ? "external" : "in-project"} module: ${filename}.`);
    }
}


/**
 * Runs all the deployments (also considering the current chainId).
 * @param reset Resets the current deployment status (journal) for the current network.
 * @param deploymentArgs The deployment arguments (same semantics of `hre.ignition.deploy` args).
 * @param hre The hardhat runtime environment.
 * @returns {Promise<void>} Nothing (async function).
 */
async function runDeployEverythingModules(reset, deploymentArgs, hre) {
    const modules = listDeployEverythingModules(hre);
    const length = modules.length;
    if (!!reset) await resetDeployments(deploymentArgs.deploymentId, hre);
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    for(let idx = 0; idx < length; idx++) {
        await hre.ignition.deploy(importModule(modules[idx].filename, modules[idx].external, chainId, hre), deploymentArgs);
    }
}


/**
 * Tells whether a file is already added as a module in the deploy-everything
 * (current) settings.
 * @param file The module file being tested.
 * @param external Whether we're talking about an imported file or a local one.
 * @param hre The hardhat runtime environment.
 * @returns {boolean} Whether it is already added or not.
 */
function isModuleInDeployEverything(file, external, hre) {
    external = !!external;
    let module = external ? file : normalizeByProjectPrefix(file, hre).file;
    let settings = loadDeployEverythingSettings(hre);
    return !!(settings.contents || []).find((element) => {
        return !!element.external === !!external || module === element.filename;
    });
}


module.exports = {
    addDeployEverythingModule, removeDeployEverythingModule, isModuleInDeployEverything,
    listDeployEverythingModules, runDeployEverythingModules
}