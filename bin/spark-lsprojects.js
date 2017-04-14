#!/usr/bin/env node

const program = require("commander");
const database = require("../lib/database");
const version = require("../package.json").version;

program.version(version).parse(process.argv);

const query = "SELECT name FROM project";

database.getDB().all(query, function(err, results) {
  if (err) {
    console.err(err);
    process.exit(1);
  } else {
    let ls = "";
    results.forEach(project => {
      ls += project.name + "\n";
    });
    process.stdout.write(ls);
  }
});
