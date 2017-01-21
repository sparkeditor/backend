#!/usr/bin/env node

const program = require("commander");
const readlineSync = require("readline-sync");
const auth = require("../lib/auth");
const version = require("../package.json").version;

program
    .version(version)
    .parse(process.argv);

const username = readlineSync.question("Enter the username of the user to delete: ");
const confirmDelete = readlineSync.keyInYN("Delete user " + username + ": Are you sure? ");

if (confirmDelete) {
    auth.removeUser(username, function(err) {
        if (err && err.code != "DOES_NOT_EXIST") {
            console.error(err);
            process.exit(1);
        }
        console.log("User " + username + " deleted.");
    });
}
else {
    console.log("Aborted.");
    process.exit(0);
}