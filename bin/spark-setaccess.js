#!/usr/bin/env node

const program = require("commander");
const auth = require("../lib/auth");
const projectManager = require("../lib/projectManager");
const version = require("../package.json").version;

let username, projectName, accessLevel;

program
    .version(version)
    .arguments("<username> <project> <access level>")
    .action(function(usernameArg, projectArg, accessLevelArg) {
        username = usernameArg;
        projectName = projectArg;
        accessLevel = accessLevelArg;
    })
    .parse(process.argv);

if (!accessLevel.match(/^(ADMIN|CONTRIBUTOR|READ\sONLY)$/i)) {
    console.log("Invalid access level. Valid options are admin, contributor, read only");
    process.exit(1);
}

accessLevel = accessLevel.replace(" ", "_").toUpperCase();

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
