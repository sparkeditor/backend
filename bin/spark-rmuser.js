#!/usr/bin/env node

const program = require("commander");
const auth = require("../lib/auth");
const version = require("../package.json").version;

let username;

program
    .version(version)
    .arguments("<username>")
    .action(function(name) {
        username = name;
    })
    .parse(process.argv);

auth.removeUser(username)
    .then(() => console.log("User " + username + " deleted."))
    .catch((err) => {
        if (err.code === "DOES_NOT_EXIST") {
            console.log("User " + username + " does not exist. No action taken.");
            process.exit(0);
        }
        else {
            console.error(err);
            process.exit(1);
        }
    });
