const fs = require("fs");
const path = require("path");


/**
 * Traverses a directory, applying a callback on each file.
 * @param directory The directory to traverse (ideally, absolute).
 * @param callback The callback (current absolute directory, local filename) to invoke.
 */
function traverseDirectory(directory, callback)
{
    let files = [];

    try {
        files = fs.readdirSync(directory);
    } catch(e) {
        throw new Error(
            `It seems that ${directory} is not a directory.`
        );
    }

    files.forEach(file => {
        const subPath = path.join(directory, file);
        const stat = fs.statSync(subPath);
        if (stat.isDirectory()) {
            traverseDirectory(subPath, callback);
        } else {
            callback(subPath, file);
        }
    });
}


/**
 * Returns the base directory of the project. It removes any
 * trailing slash.
 * @param hre The hardhat runtime environment.
 * @returns The project path.
 */
function getProjectPrefix(hre) {
    let root = hre.config.paths.root;
    while (root.endsWith('/')) root = root.substring(0, root.length - 1);
    return root;
}


/**
 * Removes the project prefix from the given file.
 * @param file The (absolute) filename.
 * @param hre The hardhat runtime environment.
 * @returns A structure {file, stripped?}. If the file starts
 * with the project prefix then stripped?=true and file= the
 * file without the project prefix. Otherwise, stripped?=false
 * and file=file.
 */
function removeProjectPrefix(file, hre) {
    const prefix = getProjectPrefix(hre) + "/";
    if (file.startsWith(prefix)) {
        return {file: file.substring(prefix.length), stripped: true}
    } else {
        return {file, stripped: false};
    }
}


/**
 * Normalizes a filename with respect to the current project
 * prefix (and returns the normalized filename or the base
 * filename if not belonging to the project).
 * @param file The (relative or absolute) filename.
 * @param hre The hardhat runtime environment.
 * @returns A structure {file, stripped?}. If the file belonged
 * to the project (relatively or absolutely) returns its relative
 * path and stripped?=true. Otherwise, returns its absolute path
 * and stripped?=false.
 */
function normalizeByProjectPrefix(file, hre) {
    return removeProjectPrefix(path.resolve(getProjectPrefix(hre), file), hre);
}


/**
 * Raises an error when forceNonInteractive is true.
 * @param forceNonInteractive The force-non-interactive setting.
 */
function checkNotInteractive(forceNonInteractive) {
    if (forceNonInteractive) throw new Error("Aborting: The current action became interactive");
}


module.exports = {
    traverseDirectory, getProjectPrefix, removeProjectPrefix, normalizeByProjectPrefix,
    checkNotInteractive
}