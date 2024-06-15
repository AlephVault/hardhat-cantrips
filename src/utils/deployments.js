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
            require(file);
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
 * Tells whether a file is already added as a module in the deploy-everything
 * (current) settings.
 * @param file The module file being tested.
 * @param external Whether we're talking about an imported file or a local one.
 * @param hre The hardhat runtime environment.
 * @returns {boolean} Whether it is already added or not.
 */
function isModuleInDeployEverything(file, external, hre) {
    const normalized = normalizeByProjectPrefix(file, hre);
    let settings = loadDeployEverythingSettings(hre);
    return !!(settings.contents || []).find((element) => {
        return !!element.external === !!external || normalized === element.filename;
    });
}


module.exports = {
    addDeployEverythingModule, removeDeployEverythingModule
}