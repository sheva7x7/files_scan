const path = require("path")
const filesScan = require("../src/files_scan");
const {
    getFilePaths, 
    ignorePath,
    getIgnorePaths,
    containsKeyword,
    extractLineComment,
    extractSegmentComment,
    parseLine,
    scanFile
} = filesScan;

describe("test ignorePath", () => {
    test("ignore true", () => {
        const filename = "node_modules"
        const ignore = ignorePath(filename, ["node_modules", ".scanignore"]);
        expect(ignore).toBe(true);
    })

    test("ignore true wildcard", () => {
        const filename = "package-lock.json"
        const ignore = ignorePath(filename, ["*lock.json", ".scanignore"]);
        expect(ignore).toBe(true);
    })

    test("ignore false nested", () => {
        const filename = "node_modules/test/test"
        const ignore = ignorePath(filename, ["node_modules", ".scanignore"]);
        expect(ignore).toBe(false);
    })

    test("ignore false ", () => {
        const filename = "index.js"
        const ignore = ignorePath(filename, ["*lock.json", ".scanignore"]);
        expect(ignore).toBe(false);
    })
})


describe("test getFilePaths", () => {
    test("file list is not empty", async () => {
        const rootDir = path.resolve(__dirname, "../__mock__")
        const ignoreList = ["node_modules", "coverage", ".gitignore", "*-lock.json"]
        const fileList = await getFilePaths(rootDir, ignoreList);
        expect(fileList.length).toBe(6);
    })
});

describe("test getIgnorePaths", () => {
    test("get correct number of paths", async () => {
        const scanIgnorePath = path.resolve(__dirname, "../.scanignore");
        const ignoredPaths = await getIgnorePaths(scanIgnorePath);
        expect(ignoredPaths.length).toBe(7)
    })
})

describe("test extractLineComment", () => {
    test("return correct line commentSegment and remainingSegment", () => {
        const line = "abc // 123"
        const lineComment = extractLineComment(line);
        expect(lineComment.commentSegment).toBe("abc // 123");
        expect(lineComment.remainingSegment).toBe("");
    })
})

describe("test extractSegmentComment", () => {
    test("return correct segment commentSegment and remainingSegment when */ is present", () => {
        const line = "abc */ 123"
        const segmentComment = extractSegmentComment(line);
        expect(segmentComment.commentSegment).toBe("abc ");
        expect(segmentComment.remainingSegment).toBe(" 123");
        expect(segmentComment.commentEnded).toBe(true);
    })

    test("return correct segment commentSegment and remainingSegment when */ is not present", () => {
        const line = "abc // 123"
        const segmentComment = extractSegmentComment(line);
        expect(segmentComment.commentSegment).toBe("abc // 123");
        expect(segmentComment.remainingSegment).toBe("");
        expect(segmentComment.commentEnded).toBe(false);
    })

    test("return correct segment commentSegment and remainingSegment when */ is at end of line", () => {
        const line = "abc // 123 */"
        const segmentComment = extractSegmentComment(line);
        expect(segmentComment.commentSegment).toBe("abc // 123 ");
        expect(segmentComment.remainingSegment).toBe("");
        expect(segmentComment.commentEnded).toBe(true);
    })
})

describe("test containsKeyword", () => {
    test("return true at start of line", () => {
        const line = "TODO 123";
        const keyword = "TODO"
        const isContains = containsKeyword(line, keyword);
        expect(isContains).toBe(true);
    })

    test("return true at end of line", () => {
        const line = "321 TODO";
        const keyword = "TODO"
        const isContains = containsKeyword(line, keyword);
        expect(isContains).toBe(true);
    })

    test("return true at middle of line", () => {
        const line = "321 TODO 123";
        const keyword = "TODO"
        const isContains = containsKeyword(line, keyword);
        expect(isContains).toBe(true);
    })

    test("return false if not whole word", () => {
        const line = "321 TODO123";
        const keyword = "TODO"
        const isContains = containsKeyword(line, keyword);
        expect(isContains).toBe(false);
    })
})

describe("test parseLine", () => {
    test("return found false and commentStarted false when no comment", () => {
        const line = "TODO 123";
        const keyword = "TODO";
        const result = parseLine(line, false, keyword);
        expect(result.found).toBe(false);
        expect(result.commentStarted).toBe(false);
    })

    test("return found true and commentStarted true when commentStarted is passed in as true", () => {
        const line = "TODO 123";
        const keyword = "TODO";
        const result = parseLine(line, true, keyword);
        expect(result.found).toBe(true);
        expect(result.commentStarted).toBe(true);
    })

    test("return found false and commentStarted true when TODO is not in line", () => {
        const line = "TOD 123";
        const keyword = "TODO";
        const result = parseLine(line, true, keyword);
        expect(result.found).toBe(false);
        expect(result.commentStarted).toBe(true);
    })

    test("return found true and commentStarted false when using line comment", () => {
        const line = "123 // TODO 123";
        const keyword = "TODO";
        const result = parseLine(line, false, keyword);
        expect(result.found).toBe(true);
        expect(result.commentStarted).toBe(false);
    })

    test("return found false and commentStarted false when using line comment but TODO is not in line", () => {
        const line = "123 // TOD 123";
        const keyword = "TODO";
        const result = parseLine(line, false, keyword);
        expect(result.found).toBe(false);
        expect(result.commentStarted).toBe(false);
    })

    test("return found true and commentStarted false when using segment comment and segment ends", () => {
        const line = "123 /* eee TODO 123 */";
        const keyword = "TODO";
        const result = parseLine(line, false, keyword);
        expect(result.found).toBe(true);
        expect(result.commentStarted).toBe(false);
    })

    test("return found true and commentStarted true when // is in line but commentStarted is set to true", () => {
        const line = "123 // TODO 123";
        const keyword = "TODO";
        const result = parseLine(line, true, keyword);
        expect(result.found).toBe(true);
        expect(result.commentStarted).toBe(true);
    })

    test("return found true and commentStarted false when // is in line but commentStarted is set to true and /* is found after //", () => {
        const line = "123 // TODO 123 */ 222";
        const keyword = "TODO";
        const result = parseLine(line, true, keyword);
        expect(result.found).toBe(true);
        expect(result.commentStarted).toBe(false);
    })

    test("return found true and commentStarted false when // is before /*", () => {
        const line = "123 // TODO  /* 123";
        const keyword = "TODO";
        const result = parseLine(line, false, keyword);
        expect(result.found).toBe(true);
        expect(result.commentStarted).toBe(false);
    })

    test("return found true and commentStarted true when /* is before //", () => {
        const line = "123 /* TODO  // 123";
        const keyword = "TODO";
        const result = parseLine(line, false, keyword);
        expect(result.found).toBe(true);
        expect(result.commentStarted).toBe(true);
    })

    test("return found true and commentStarted true when consecutive /* occurs before comment is ended", () => {
        const line = "123 /* TODO  /* 123";
        const keyword = "TODO";
        const result = parseLine(line, false, keyword);
        expect(result.found).toBe(true);
        expect(result.commentStarted).toBe(true);
    })
})

describe("test scanFile", () => {
    test("returns true if line commented", async () => {
        const filePath = path.resolve(__dirname, "../__mock__/test2.txt");
        const isTodo = await scanFile(filePath, "TODO");
        expect(isTodo).toBe(true);
    })

    test("returns true if segment commented", async () => {
        const filePath = path.resolve(__dirname, "../__mock__/testtest");
        const isTodo = await scanFile(filePath, "TODO");
        expect(isTodo).toBe(true);
    })

    test("returns false if no comment", async () => {
        const filePath = path.resolve(__dirname, "../__mock__/test.js");
        const isTodo = await scanFile(filePath, "TODO");
        expect(isTodo).toBe(false);
    })
})


