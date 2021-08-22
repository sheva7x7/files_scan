const fs = require("fs");
const readline = require('readline');
const fsPromise = fs.promises;

/**
* function to get all file paths that do not match the patterns in the ignoreList
* params - rootDir : the root directory to start the scan
* params - ignoreList : list of path patterns to ignore
* returns - array[] : list of file paths
*/
const getFilePaths = async (rootDir, ignoreList) => {
    let arr = []
    const fileList = await fsPromise.readdir(rootDir, {withFileTypes: true});
    for (const file of fileList) {
        if (!ignorePath(file.name, ignoreList)){
            if (file.isDirectory()) {
                const dir = `${rootDir}/${file.name}`
                const nestedFileList = await getFilePaths(dir, ignoreList)
                arr = arr.concat(nestedFileList)
            }
            else {
                arr = arr.concat(`${rootDir}/${file.name}`)
            }
        }
    }
    return arr;
}

/**
* function to get path patterns to be ignored during scan
* params - ignorePath : the path to look for the list
* returns - array[] : list of path patterns
*/
const getIgnorePaths = async (ignorePath) => {
    const fileStream = fs.createReadStream(ignorePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })
    const arr = []
    for await (const line of rl) {
        arr.push(line);
    }
    return arr;
}

/**
* function to parse a line
* params - line : line to be parsed
* params - commentStarted : a boolean to indicate if this line is in between a segment comment
* params - keyword : keyword to be scanned for
* returns - object: 
* return schema - found : boolean, keyword found in a comment segment
* return schema - commentStarted : boolean:, to indicate if the next line is part of a segment comment
*/
const ignorePath = (path, ignoreList) => {
    return ignoreList.some((item) => {
        const regex = new RegExp(`^${item.replace("*", ".*")}$`);
        return regex.test(path);
    })
}

/**
* function to parse a line
* params - line : line to be parsed
* params - commentStarted : a boolean to indicate if this line is in between a segment comment
* params - keyword : keyword to be scanned for
* returns - object: 
* return schema - found : boolean, keyword found in a comment segment
* return schema - commentStarted : boolean:, to indicate if the next line is part of a segment comment
*/
const parseLine = (line, commentStarted, keyword) => {
    let commentSegment = "";
    let remainingSegment = line;
    let segmentCommentStarted = commentStarted || false
    while (remainingSegment.length) {
        if (segmentCommentStarted) {
            const segmentComment = extractSegmentComment(remainingSegment);
            commentSegment = segmentComment.commentSegment;
            remainingSegment = segmentComment.remainingSegment;            
            segmentCommentStarted = !segmentComment.commentEnded;
        } else {
            const lineCommentIndex = remainingSegment.indexOf("//");
            const segmentCommentIndex = remainingSegment.indexOf("/*");
            const indexDiff = lineCommentIndex - segmentCommentIndex;
            if (lineCommentIndex === -1 && segmentCommentIndex === -1) {
                remainingSegment = ""
            } else if (lineCommentIndex > -1) {
                if (segmentCommentIndex === -1) {
                    //use line comment
                    const lineComment = extractLineComment(remainingSegment.substring(lineCommentIndex + 2));
                    commentSegment = lineComment.commentSegment;
                    remainingSegment = lineComment.remainingSegment;
                    segmentCommentStarted = false
                } else if (indexDiff > 0) {
                    // use segment comment
                    const segmentComment = extractSegmentComment(remainingSegment.substring(segmentCommentIndex + 2));
                    commentSegment = segmentComment.commentSegment;
                    remainingSegment = segmentComment.remainingSegment;
                    segmentCommentStarted = !segmentComment.commentEnded;
                } else {
                    // use line comment
                    const lineComment = extractLineComment(remainingSegment.substring(lineCommentIndex + 2));
                    commentSegment = lineComment.commentSegment;
                    remainingSegment = lineComment.remainingSegment;
                    segmentCommentStarted = false
                }
            } else {
                // use segment comment: segmentCommentIndex > -1 && lineCommentIndex === -1
                const segmentComment = extractSegmentComment(remainingSegment.substring(segmentCommentIndex + 2));
                commentSegment = segmentComment.commentSegment;
                remainingSegment = segmentComment.remainingSegment;
                segmentCommentStarted = !segmentComment.commentEnded;
            }
        }
        if (containsKeyword(commentSegment, keyword)) {
            return {
                found: true,
                commentStarted: segmentCommentStarted
            }
        }
    }
    return {
        found: false,
        commentStarted: segmentCommentStarted
    };
}

/**
* function to extract segment comment object
* params - remainingSegment
* returns - object: 
* return schema - commentSegment : the comment segment
* return schema - remainingSegment : remaining part of the line after end of comment
* return schema - commentEnded : boolean, true if the segment of comment has ended
*/
const extractSegmentComment = (remainingSegment) => {
    const endOfCommentIndex = remainingSegment.indexOf("*/");
    let commentEnded = false
    if (endOfCommentIndex > -1) {
        commentSegment = remainingSegment.substring(0, endOfCommentIndex);
        remainingSegment = remainingSegment.substring(endOfCommentIndex + 2);
        commentEnded = true
    } else {
        commentSegment = remainingSegment;
        remainingSegment = "";
    }
    return {
        commentSegment,
        remainingSegment,
        commentEnded
    };
}

/**
* function to extract line comment object
* params - comment
* returns - object: 
* return schema - commentSegment : the comment segment
* return schema - remainingSegment : remaining part of the line after end of comment
*/
const extractLineComment = (comment) => {
    commentSegment = comment;
    remainingSegment = "";
    return {
        commentSegment,
        remainingSegment
    };
}

/**
* function to check if a line contains keyword
* params - line: entire line of string to be scanned for
* params - keyword: keyword to be scan for
* returns - boolean : true if keyword found, false if keyword not found
*/
const containsKeyword = (line, keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`);
    return regex.test(line);
}

/**
* function to scan file
* params - filePath
* params - keyword: keyword to be scan for
* returns - boolean : true if keyword found, false if keyword not found
*/
const scanFile = async (filePath, keyword) => {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })
    let commentStarted = false
    for await (const line of rl) {
        const result = parseLine(line, commentStarted, keyword);
        if (result.found) {
            fileStream.close();
            return true;
        }
        commentStarted = result.commentStarted;
    }
    fileStream.close();
    return false
}

exports.getFilePaths = getFilePaths;
exports.ignorePath = ignorePath;
exports.getIgnorePaths = getIgnorePaths;
exports.containsKeyword = containsKeyword;
exports.extractLineComment = extractLineComment;
exports.extractSegmentComment = extractSegmentComment;
exports.parseLine = parseLine;
exports.scanFile = scanFile;