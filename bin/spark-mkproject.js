#!/usr/bin/env node

const program = require("commander");
const projectMananager = require("../lib/projectManager");
const version = require("../package.json").version;

let projectName, rootDirectory;

program
  .version(version)
  .arguments("<name> [directory]")
  .action(function(name, dir) {
    projectName = name;
    rootDirectory = dir;
  });

program.parse(process.argv);

const projectDefinition = {
  name: projectName,
  root_directory: rootDirectory
};

projectMananager
  .createProject(projectDefinition)
  .then(() => console.log("Project " + projectName + " created."))
  .catch(err => {
    if (err.code === "ENOENT") {
      console.error(rootDirectory + " does not exist!");
      process.exit(0);
    } else if (err.code === "SQLITE_CONSTRAINT") {
      console.error("Project " + projectName + " already exists!");
      process.exit(0);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
