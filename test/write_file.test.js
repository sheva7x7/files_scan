const fs = require("fs");
const path = require("path");
const writeFile = require("../src/write_file");
const {
    open,
    close
} = writeFile;

describe("open", () => {

    beforeEach(async() => {
        const dir = path.resolve(__dirname, "__mock__");
        if (fs.existsSync(dir)) {
            fs.rmdirSync(dir, {recursive: true})
        }
    })

    test("open creates new file", async () => {
        const dir = path.resolve(__dirname, "__mock__");
        const filename = "testtest";
        const writeStream = await open(dir, filename);
        close();
        const filePath = path.resolve(dir, filename);
        const exists = fs.existsSync(filePath);
        expect(exists).toBe(true);
    })

    test("open create new folder", async () => {
        const dir = path.resolve(__dirname, "__mock__");
        const filename = "testtest.js";
        const writeStream = await open(dir, filename);
        close();
        const exists = fs.existsSync(dir);
        expect(exists).toBe(true);
    })
})