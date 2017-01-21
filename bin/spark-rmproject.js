#!/usr/bin/env node

const program = require("commander");
const readlineSync = require('readline-sync');
const projectManager = require("../lib/projectManager");
const version = require("../package.json").version;

program
    .version(version)
    .parse(process.argv);

const projectName = readlineSync.question("Enter the name of the project to delete: ");
const confirmDelete = readlineSync.keyInYN("Delete project " + projectName + ": Are you sure? ");

if (confirmDelete) {
    projectManager.deleteProject(projectName, function(err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log("Project " + projectName + " deleted.")
    });
}
else {
    console.log("Aborted.");
    process.exit(0);
}