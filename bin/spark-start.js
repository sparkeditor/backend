#!/usr/bin/env node

const program = require("commander");
const server = require("../lib/socketRouter");
const logger = require("../lib/logger");
const version = require("../package.json").version;

let port = process.env.NODE_ENV === 'production' ? 80 : 8080;

program
    .version(version)
    .arguments("[port]")
    .action(function(portArg) {
        port = portArg || port;
    });

program.parse(process.argv);

server.listen(port, function() {
    logger.info("Spark server listening on port " + port);
});