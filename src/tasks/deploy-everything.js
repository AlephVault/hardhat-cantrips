const enquirer = require("enquirer");
const {cantripsScope, inputUntil} = require("./common");
const {checkNotInteractive} = require("../utils/common");


/**
 * Chooses an action out of the available ones.
 * @param action The initial (and perhaps to keep) action. If not valid,
 * this command tries to become interactive and pick one of the available
 * actions (run, add, remove, list).
 * @param forceNonInteractive If true, raises an error when the command tries
 * to become interactive.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<*|string>} The chosen action (async function).
 */
async function chooseAction(action, forceNonInteractive, hre) {
    action = (action || "").trim().toLowerCase();
    const actions = ["add", "remove", "list", "run"];
    const choices = [
        {name: "add", message: "Adds a new deployment module (prompted or via --module)"},
        {name: "remove", message: "Removes a deployment module (prompted or via --module)"},
        {name: "list", message: "Lists all the deployment modules (sequentially)"},
        {name: "run", message: "Executes all the deployment modules (to the end)"}
    ];
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

}


/**
 * Lists all the registered modules in the deployment.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<void>} Nothing (async function).
 */
async function list(hre) {

}


/**
 * Runs all the registered modules in the deployment.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<void>} Nothing (async function).
 */
async function run(hre) {

}


cantripsScope.task("deploy-everything", "Manages or executes the 'full deployment' in a chain")
    .addOptionalPositionalParam("action", "The action to execute: add, remove, list or run")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .addFlag("external", "Tells, for add/remove, that the module comes from an external package")
    .addOptionalParam("module", "Tells the module to add/remove")
    .setAction(async ({action, forceNonInteractive, external, module}, hre, runSuper) => {
        try {
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
                case "run":
                    await run(hre);
                    break;
                default:
                    console.error("Invalid action: " + action);
            }
        } catch(e) {
            console.error(e);
        }
    });
