const path = require("path");
const fs = require("fs");

const templatesDir = path.resolve(__dirname, "..", "..", "data", "generation", "templates");


/**
 * Applies a template from a template file (relative path) by using some data,
 * and dumps the results into the target file path (absolute path).
 * @param filePath The source template path.
 * @param replacements The object with the replacements.
 * @param toFilePath The target dump path.
 */
function applyTemplate(filePath, replacements, toFilePath) {
    const template = fs.readFileSync(path.resolve(templatesDir, filePath), {encoding: 'utf8'});
    const data = template.replace(/#(\w+)#/g, (match, key) => {
        return replacements[key] !== undefined ? replacements[key] : match;
    });
    fs.writeFileSync(toFilePath, data, {encoding: 'utf8'});
}


module.exports = {
    applyTemplate
}