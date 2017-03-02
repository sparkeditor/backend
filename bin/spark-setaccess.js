#!/usr/bin/env node

const program = require("commander");
const readlineSync = require("readline-sync");
const auth = require("../lib/auth");
const projectManager = require("../lib/projectManager");
const version = require("../package.json").version;

program
    .version(version)
    .parse(process.argv);

const username = readlineSync.question("Enter username: ");
const projectName = readlineSync.question("Enter project name: ");
const accessLevelQuery = readlineSync.question("Enter access level: ", {
    limit: /^(ADMIN|CONTRIBUTOR|READ\sONLY)$/i,
    limitMessage: "Invalid access level"
});

const accessLevel = accessLevelQuery.replace(" ", "_").toUpperCase();

projectManager.getProject(projectName)
    .then((project) => {
        return auth.setAccess(username, project.id, accessLevel);
    })
    .then(() => {
        console.log(`Access to project ${projectName} for user ${username} set to ${accessLevel}.`);
    })
    .catch((err) => {
        if (err.code === "DOES_NOT_EXIST") {
            console.log("User or project does not exist")
        }
        else {
            console.error(err);
        }
        process.exit(1);
    });
