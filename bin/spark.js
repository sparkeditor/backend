#!/usr/bin/env node

const program = require("commander");
const initialize = require("../lib/initializer");
const logger = require("../lib/logger");
const version = require("../package.json").version;

initialize(function(err) {
    if (err) {
        logger.error(err);
        process.exit(1);
    }
    program
        .version(version)
        .command("start [port]", "starts the Spark server", {isDefault: true})
        .command("mkuser", "makes a new user")
        .command("rmuser", "removes a user")
        .command("mkproject", "makes a new Spark project")
        .command("rmproject", "removes a Spark project")
        .parse(process.argv);
});