const os = require("os");
const path = require("path");
const fs = require("fs");
const winston = require("winston");
const ConfigurationManager = require("../configurationManager");

const configurationManager = new ConfigurationManager(path.join(os.homedir(), ".spark"));
const logFile = configurationManager.getValue("logFile", path.join(os.homedir(), ".spark.log"));

let logger;

if (process.env.NODE_ENV === "production") {
    // Production logger

    // Create the log file if it does not exist
    fs.openSync(logFile, 'a');

    logger = new (winston.Logger)({
        transports: [
            new(winston.transports.File)({
                name: 'logFile',
                filename: logFile,
                level: 'error',
                prettyPrint: true,
                handleExceptions: true,
                humanReadableUnhandledExceptions: true,
                timestamp: true
            })
        ]
    });
}
else {
    // Development logger
    logger = new (winston.Logger)({
        transports: [
            new(winston.transports.Console)({
                level: 'info',
                colorize: true,
                prettyPrint: true,
                handleExceptions: true,
                humanReadableUnhandledExceptions: true,
                timestamp: true
            })
        ]
    });
}

/**
 * This module exposes a logger that logs to console or a file,
 * depending on process.env.NODE_ENV
 * @module Logger
 */
module.exports = logger;