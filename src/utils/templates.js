import path from "path";
import * as fs from "fs";

const templatesDir = path.resolve(__dirname, "..", "..", "data", "generation", "templates");

export function applyTemplate(filePath, replacements) {
    const data = fs.readFileSync(path.resolve(templatesDir, filePath), 'utf8');
    return data.replace(/#(\w+)#/g, (match, key) => {
        return replacements[key] !== undefined ? replacements[key] : match;
    });
}