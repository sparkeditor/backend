#!/usr/bin/env node

const program = require("commander");
const projectManager = require("../lib/projectManager");
const version = require("../package.json").version;

let projectName;

program
    .version(version)
    .arguments("<name>")
    .action(function(name) {
        projectName = name;
    })
    .parse(process.argv);

projectManager.deleteProject(projectName)
    .then(() => console.log("Project " + projectName + " deleted."))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
