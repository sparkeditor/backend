#!/usr/bin/env node

const program = require("commander");
const readlineSync = require("readline-sync");
const projectMananager = require("../lib/projectManager");
const version = require("../package.json").version;

program
    .version(version)
    .parse(process.argv);

const projectName = readlineSync.question("Enter project name: ");
const rootDirectory = readlineSync.question("Enter existing project directory, or leave blank to generate a new directory: ");

const projectDefinition = {
    name: projectName,
    root_directory: rootDirectory
};

projectMananager.createProject(projectDefinition, function(err) {
    if (err) {
        if (err.code === "ENOENT") {
            console.error(rootDirectory + " does not exist!");
            process.exit(0);
        }
        else if (err.code === 'SQLITE_CONSTRAINT') {
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