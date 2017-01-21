#!/usr/bin/env node

const program = require("commander");
const readlineSync = require("readline-sync");
const projectMananager = require("../lib/projectManager");
const version = require("../package.json").version;

program
    .version(version)
    .parse(process.argv);

const projectName = readlineSync.question("Enter project name: ");
const rootDirectory = readlineSync.questionPath("Enter project root directory: ", {isDirectory: true});

projectMananager.createProject({name: projectName, root_directory: rootDirectory}, function(err) {
    if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            console.error("Project " + projectName + " already exists!");
            process.exit(0);
        }
        else {
            console.error(err);
            process.exit(1);
        }
    }
    console.log("Project " + projectName + " created.");
});