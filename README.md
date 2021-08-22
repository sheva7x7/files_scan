# Summary

This project is a node.js program to recursively scan through files in a folder and identify files with TODO comments and output the list of files to an output file

## Pre-requisite

The program is running in node.js. Node.js runtime version 12 or above is recommended.

Npm/Yarn is required to install the jest package and run the unit test for this project.

## Assumptions

There were a few assumptions made during the implementation
- TODO scan is only valid for occurance in a comment segment.
- A comment segment includes a substring of a line that start from // or a segment block between /* and */ , other forms of comment segments are not considered.
- All files are assumed to be valid files (compilable js files)
- Certain exception scenarios have not been handled. For example // within parenthesis block

## Setup

Install packages
```
npm install or yarn install
```

Run the program
```
npm start
```
This will run the scan with the current directory as the root directory

```
npm start [rootDir]
```
This will run the scan with rootDir(relative path to current directory) as the root directory

Run unit test
```
npm test
```