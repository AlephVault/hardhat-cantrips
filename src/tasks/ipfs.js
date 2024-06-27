const {cantripsScope} = require("./common");
const path = require("path");
const fs = require("fs");
const {launchIPFSGateway} = require("../utils/ipfs");
const {inputPause} = require("../utils/input");


cantripsScope
    .task("ipfs-node", "Starts an IPFS server with auto-watch over the file system")
    .setAction(async (_, hre, runSuper) => {
        try {
            // Get or create the ".local/ipfs-root" project directory.
            const ipfsContentDirectory = path.resolve(hre.config.paths.root, ".local", "ipfs-root", "content");
            const ipfsRepoDirectory = path.resolve(hre.config.paths.root, ".local", "ipfs-root", "repo");
            fs.mkdirSync(ipfsContentDirectory, {recursive: true});
            fs.mkdirSync(ipfsRepoDirectory, {recursive: true});

            // Launch the IPFS server.
            const {watcher, ipfs, gateway, api} = await launchIPFSGateway(
                ipfsContentDirectory, ipfsRepoDirectory
            );
            console.log("IPFS server started");

            // Wait for a key to be pressed.
            await new Promise(resolve => {
                setTimeout(() => resolve(), 3000);
            })
            await inputPause("Press any key to stop the IPFS server...");

            // Close everything.
            watcher.close();
            await ipfs.stop();
            await api.stop();
            await gateway.stop();
            console.log("IPFS server stopped");
        } catch(e) {
            console.error("There was an error running the IPFS node:");
            console.error(e);
        }
    });