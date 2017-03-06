#!/usr/bin/env node

const program = require("commander");
const auth = require("../lib/auth");
const version = require("../package.json").version;

let username, password;

program
    .version(version)
    .arguments("<username> <password>")
    .action(function(usernameArg, passwordArg) {
        username = usernameArg;
        password = passwordArg;
    })
    .parse(process.argv);

auth.addUser({username: username, password: password})
    .then(() => console.log("User " + username + " created."))
    .catch((err) => {
        if (err.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: user.username") {
            console.log("User " + username + " already exists.")
        }
        else {
            console.error(err);
        }
        process.exit(1);
    });
