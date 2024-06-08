import fs from "fs";
import path from "path";


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


module.exports = {
    traverseDirectory
}