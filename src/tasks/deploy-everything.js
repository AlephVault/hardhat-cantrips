const enquirer = require("enquirer");
const {cantripsScope, inputUntil} = require("./common");
const {checkNotInteractive} = require("../utils/common");
const {
    addDeployEverythingModule, removeDeployEverythingModule, listDeployEverythingModules, isModuleInDeployEverything,
    runDeployEverythingModules
} = require("../utils/deployments");
const path = require("path");
const fs = require("fs");


/**
 * Chooses an action out of the available ones.
 * @param action The initial (and perhaps to keep) action. If not valid,
 * this command tries to become interactive and pick one of the available
 * actions (run, add, remove, list).
 * @param forceNonInteractive If true, raises an error when the command tries
 * to become interactive.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<string>} The chosen action (async function).
 */
async function chooseAction(action, forceNonInteractive, hre) {
    action = (action || "").trim().toLowerCase();
    const choices = [
        {name: "add", message: "Add a new deployment module (prompted or via --module)"},
        {name: "remove", message: "Remove a deployment module (prompted or via --module)"},
        {name: "list", message: "List all the deployment modules (sequentially)"},
        {name: "run", message: "Execute all the deployment modules ('till the end)"},
        {name: "check", message: "Check whether a module is added"}
    ];
    const actions = choices.map((c) => c.name);
    if (actions.indexOf(action) >= 0) {
        return action;
    }
    if (action) {
        console.error(`You've chosen an unsupported action: ${action}.`);
    }

    // Now, we'll prompt the user for the action to pick.
    checkNotInteractive(forceNonInteractive);
    let prompt = new enquirer.Select({
        name: "action",
        message: "Select what to do:",
        choices
    });
    return await prompt.run();
}


/**
 * Asks for a module path from the user, interactively.
 * @param external Tells this is an external module import.
 * @param forceNonInteractive Tells that interactive commands
 * are not allowed by raising an error.
 * @returns {Promise<string>} The chosen action (async function).
 */
function getModule(external, forceNonInteractive) {
    checkNotInteractive(forceNonInteractive);
    console.log(external
        ? "You must set a module. It must be a file belonging to an NPM/yarn-installed package."
        : "You must set a module. It must be a path of an in-project file.");
    const prompt = external
        ? "Package-relative JavaScript file:"
        : "Project-relative JavaScript file:";
    return inputUntil("path/to/file.js", prompt, (m) => {
        m = m.trim();
        return m.endsWith(".js") || m.endsWith(".ts");
    }, "The chosen file is not valid");
}


/**
 * Adds a module to the deployment.
 * @param module The path to the module. If not given, this action tries
 * to become interactive and:
 * 1. For external modules: prompt the user to write the module path.
 *    That file is import-tried globally.
 * 2. For files: prompt the user to choose one of the available modules
 *    inside the project's ignition/modules directory. That file is also
 *    import-tried but locally to the project.
 * @param external Whether it is an external path or a project-local one.
 * @param forceNonInteractive If true, raises an error when the command tries
 * to become interactive.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<void>} Nothing (async function).
 */
async function add(module, external, forceNonInteractive, hre) {
    module = (module || "").trim() || getModule(external, forceNonInteractive);
    addDeployEverythingModule(module, external, hre);
    console.log("The module was successfully added to the full deployment.");
}


/**
 * Removes a module from the deployment.
 * @param module The path to the module. If not given, this action tries
 * to become interactive and list all the added modules (only those that
 * are local or external, depending on whether the external argument is
 * false or true, respectively).
 * @param external Whether it is an external path or a project-local one.
 * @param forceNonInteractive If true, raises an error when the command tries
 * to become interactive.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<void>} Nothing (async function).
 */
async function remove(module, external, forceNonInteractive, hre) {
    module = (module || "").trim() || getModule(external, forceNonInteractive);
    removeDeployEverythingModule(module, external, hre);
    console.log("The module was successfully removed to the full deployment.");
}


/**
 * Lists all the registered modules in the deployment.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<void>} Nothing (async function).
 */
async function list(hre) {
    const contents = listDeployEverythingModules(hre);
    if (!contents.length) {
        console.log("There are no modules added to the full deployment.");
    } else {
        console.log("These modules are added to the full deployment:");
    }
    contents.forEach((e) => {
        const prefix = e.external ? "External file" : "Project file";
        console.log(`- ${prefix}: ${e.filename}`);
    })
}


/**
 * Checks whether a module is added to the full deployment.
 * @param module The path to the module. If not given, this action tries
 * to become interactive and list all the added modules (only those that
 * are local or external, depending on whether the external argument is
 * false or true, respectively).
 * @param external Whether it is external or local to the project.
 * @param forceNonInteractive If true, raises an error when the command tries
 * to become interactive.
 * @param hre The hardhat runtime environment.
 */
function check(module, external, forceNonInteractive, hre) {
    module = (module || "").trim() || getModule(external, forceNonInteractive);
    if (isModuleInDeployEverything(module, external, hre)) {
        console.log("The module is added to the full deployment.");
    } else {
        console.log("The module is not added to the full deployment.");
    }
}


/**
 * Loads the contents of a parameters file.
 * @param file The file to load from.
 * @returns {*} The parameters.
 */
function loadParameters(file) {
    try {
        const content = fs.readFileSync(file, {encoding: 'utf8'});
        return JSON.parse(content);
    } catch(e) {
        return {};
    }
}


/**
 * Runs all the registered modules in the deployment.
 * @param parametersFile Optionally loads the parameters (same semantics of ignition's deploy command).
 * @param strategyName The ignition deployment strategy to use (same semantics of ignition's deploy command).
 * @param deploymentId An optional id for the deployment (same semantics of ignition's deploy command).
 * @param defaultSender The default sender (same semantics of ignition's deploy command).
 * @param reset Whether to reset the deployment state (journal) or not (same semantics of ignition's deploy command).
 * @param hre The hardhat runtime environment.
 * @returns {Promise<void>} Nothing (async function).
 */
async function run(parametersFile, strategyName, deploymentId, defaultSender, reset, hre) {
    const strategyConfig = hre.config.ignition?.strategyConfig?.[strategyName];
    await runDeployEverythingModules(reset,{
        config: {}, strategyConfig, strategy: strategyName, deploymentId, defaultSender,
        parameters: loadParameters(parametersFile)
    }, hre);
}


cantripsScope.task("deploy-everything", "Manages or executes the full deployment in a chain")
    .addOptionalPositionalParam("action", "The action to execute: add, remove, list, check or run")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .addFlag("external", "Tells, for add/remove, that the module comes from an external package")
    .addOptionalParam("module", "Tells the module to add/remove")
    .addOptionalParam("parameters", "For the 'run' action: A relative path to a JSON file to use for the module parameters")
    .addOptionalParam("deploymentId", "For the 'run' action: Set the id of the deployment")
    .addOptionalParam("defaultSender", "For the 'run' action: Set the default sender for the deployment")
    .addOptionalParam("strategy", "For the 'run' action: Set the deployment strategy to use", "basic")
    .addFlag("reset", "For the 'run' action: Wipes the existing deployment state before deploying")
    .setAction(async ({action, forceNonInteractive, external, module, parameters: parametersFile, defaultSender, strategy, deploymentId, reset}, hre, runSuper) => {
        try {
            parametersFile = (parametersFile || "").trim();
            action = await chooseAction(action, forceNonInteractive, hre);
            switch(action)
            {
                case "add":
                    await add(module, external, forceNonInteractive, hre);
                    break;
                case "remove":
                    await remove(module, external, forceNonInteractive, hre);
                    break;
                case "list":
                    await list(hre);
                    break;
                case "check":
                    check(module, external, forceNonInteractive, hre);
                    break;
                case "run":
                    await run(parametersFile, strategy, deploymentId, defaultSender, reset, hre);
                    break;
                default:
                    console.error("Invalid action: " + action);
            }
        } catch(e) {
            console.error(e);
        }
    });
