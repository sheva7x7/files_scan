const path = require("path");
const filesScan = require("./src/files_scan");
const writeFile = require("./src/write_file");
const KEYWORD = "TODO"

const run = async () => {
    try {
        const [, , ...args] = process.argv;
        const dir = args[0] || "."
        const rootDir = path.resolve(__dirname, dir)
        const ignoreFile = path.resolve(__dirname, ".scanignore");
        const ignoredPaths = await filesScan.getIgnorePaths(ignoreFile);
        const fileList = await filesScan.getFilePaths(rootDir, ignoredPaths);
        let writer;
        for (const file of fileList) {
            if (await filesScan.scanFile(file, KEYWORD)) {
                if (writer === undefined) {
                    const directory = path.resolve(__dirname, "scan_report");
                    const filename = "output";
                    writer = await writeFile.open(directory, filename);
                }
                writeFile.writeLine(file)
            }
        }
        if (writer) {
            writeFile.close();
        }
    } catch(err) {
        console.log(err);
    }
}

run();