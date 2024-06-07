import path from "path";
import * as fs from "fs";

const templatesDir = path.resolve(__dirname, "..", "..", "data", "generation", "templates");

export function applyTemplate(filePath, replacements, toFilePath) {
    const template = fs.readFileSync(path.resolve(templatesDir, filePath), {encoding: 'utf8'});
    const data = template.replace(/#(\w+)#/g, (match, key) => {
        return replacements[key] !== undefined ? replacements[key] : match;
    });
    fs.writeFileSync(toFilePath, data, {encoding: 'utf8'});
}