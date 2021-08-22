const fs = require("fs");
const path = require("path");
const endOfLine = require("os").EOL;
const fsPromise = fs.promises;

let writer;

const open = async (directory, filename) => {
    try{
        const stat = await fsPromise.stat(directory)
        if (stat.isDirectory()) {
            await fsPromise.mkdir(directory, {recursive: true});
        }
    } catch(err) {
        if (err.code === "ENOENT") {
            await fsPromise.mkdir(directory, {recursive: true});
        }
    }
    const filePath = path.resolve(directory, filename);
    writer = fs.createWriteStream(filePath);
    return writer;
}

const close = () => {
    writer.close();
    return writer
}

const writeLine = (str) => {
    writer.write(str+endOfLine);
}

exports.open = open;
exports.close = close;
exports.writeLine = writeLine;