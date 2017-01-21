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

let inputCompleted = false;
let password;
while (!inputCompleted) {
    password = readlineSync.question("Enter password: ", {hideEchoBack: true});
    const confirmPassword = readlineSync.question("Confirm password: ", {hideEchoBack: true});

    if (password === confirmPassword) {
        inputCompleted = true;
    }
    else {
        console.log("Passwords must match.");
    }
}

auth.addUser({username: username, password: password}, function(err) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("User " + username + " created.");
});