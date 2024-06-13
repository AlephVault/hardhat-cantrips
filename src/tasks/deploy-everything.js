const {applyTemplate} = require("../utils/templates");
const enquirer = require("enquirer");
const path = require("path");
const {cantripsScope, inputUntil} = require("./common");


cantripsScope.task("deploy-everything", "Manages or executes the 'full deployment' in a chain")
    .addOptionalParam("add", "Adds a file to the deployment (might be a chain-specific file)")
    .addFlag("imported", "When using --add, tells that the file is imported via require() instead of belonging to the project")
    .addFlag("run", "Runs the full deployment. When not using --add, this is done by default")
    .setAction(async ({add, run, imported}, hre, runSuper) => {
        try {
            add = (add || "").trim();
            run = !!(run || !add);
            // Please note: there's only ONE deployment file: ignition/deploy-everything.json.
            // TODO 1. Get the chainId (string from base-10) from the current network.
            //         This only makes sense when running, not when only --add is set.
            // TODO 2. For --add ... --imported, take the ... file as good. It comes
            //         from an external package, actually. If not present / provided,
            //         ask for it via prompt and ensure it CAN be imported and it is
            //         not already included in our deployment file.
            // TODO 3. For --add ... without --imported, take the ... file. Then also
            //         take all the .js files inside the project's ignition/modules
            //         directory, except those files (from that directory) already in
            //         the deployment file. If the file is not provided or not among
            //         the options, complain and prompt the user to choose an option.
            //         Otherwise, take it.
            // TODO 4. Taking the file (and telling whether it is imported or not),
            //         add the entry to the deployment file.
            // TODO 5. If run: run the deployment file.
        } catch(e) {
            console.log(e);
        }
    });
