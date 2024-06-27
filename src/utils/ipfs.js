const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');


async function launchIPFSGateway(rootDirectory) {
    // Creating the IPFS server.
    const IPFS = await import('ipfs-core');
    const ipfs = await IPFS.create();

    // Normalizing the root directory.
    if (rootDirectory.endsWith('/')) {
        rootDirectory = rootDirectory.substring(0, rootDirectory.length - 1);
    }
    const relativeDirStart = rootDirectory.length + 1;

    // Function to add a file to IPFS.
    async function addToIPFS(filePath) {
        const content = fs.readFileSync(filePath);
        const fileAdded = await ipfs.add({ path: filePath.substring(relativeDirStart), content });
        console.log(`File CID: ${fileAdded.cid}`);
    }

    // Watcher for the filesystem.
    const watcher = chokidar.watch(rootDirectory, { persistent: true });

    watcher
        .on('add', async filePath => {
            console.log(`File ${filePath} has been added`);
            await addToIPFS(filePath);
        })
        .on('unlink', async filePath => {
            console.log(`File ${filePath} has been removed`);
        })
        .on('change', async filePath => {
            console.log(`File ${filePath} has been changed`);
            await addToIPFS(filePath); // Re-adding the file to update it in IPFS
        })
        .on('addDir', dirPath => {
            console.log(`Directory ${dirPath} has been added`);
        })
        .on('unlinkDir', dirPath => {
            console.log(`Directory ${dirPath} has been removed`);
        })
        .on('error', error => {
            console.error(`Watcher error: ${error}`);
        })
        .on('ready', () => {
            console.log('Initial scan complete. Ready for changes');
        })
        .on('all', async (event, filePath) => {
            if (event === 'rename') {
                console.log(`File ${filePath} has been renamed`);
                await addToIPFS(filePath);
            }
        });

    // Return both running objects.
    return {
        ipfs, watcher
    }
}


module.exports = {
    launchIPFSGateway
}