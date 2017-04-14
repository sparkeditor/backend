#!/usr/bin/env node

const program = require("commander");
const initialize = require("../lib/initializer");
const logger = require("../lib/logger");
const version = require("../package.json").version;

initialize()
  .then(() => {
    program
      .version(version)
      .command("start [port]", "starts the Spark server", { isDefault: true })
      .command("mkuser <username> <password>", "makes a new user")
      .command("rmuser <username>", "removes a user")
      .command("mkproject <name> [directory]", "makes a new Spark project")
      .command("rmproject <name>", "removes a Spark project")
      .command(
        "setaccess <username> <project> <access level>",
        "sets a user's access level to a project"
      )
      .command("lsusers", "lists users")
      .command("lsprojects", "lists projects")
      .parse(process.argv);
  })
  .catch(err => {
    logger.error(err);
    process.exit(1);
  });
