const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");
const asyncForEach = require("async-for-each");
const auth = require("../auth");
const projectManager = require("../projectManager");
const logger = require("../logger");
const constants = require("./serverConstants");

Promise.promisifyAll(fs);
const makeFileAsync = Promise.promisify(makeFile);

/**
 * @typedef {object} file
 * @property {string} name - the file's name
 * @property {number} size - the file's size
 * @property {string} path - the file's absolute path
 * @property {string} [type] - the file's type. Either the file's extension, "directory", or undefined
 * @property {file[]} [children] - children of this file object (if it is a directory)
 */

/**
 * @typedef {object} projectInfo
 * @property {string} name - the project's name
 * @property {number} id - the project's id
 * @property {file} rootDirectory - the root directory of the project
 */

/**
 * Factory function to generate the openProject callback
 * @param {object} client - the socketIO client object
 * @param {serverContext} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
  return function(data, callback) {
    const credentials = data.credentials;
    const projectId = data.projectId;

    Promise.all([
      auth.authenticate(credentials.username, credentials.password, projectId),
      auth.getAccess(credentials.username, projectId)
    ])
      .spread((hasAccess, accessLevel) => {
        if (!hasAccess) {
          return false;
        } else {
          return (
            accessLevel === auth.accessLevels.CONTRIBUTOR ||
            accessLevel === auth.accessLevels.ADMIN
          );
        }
      })
      .then(hasAccess => {
        if (!hasAccess) {
          return { status: constants.status.ACCESS_DENIED };
        } else {
          /** @type {projectInfo} */
          const projectInfo = {};
          return projectManager
            .getProject(projectId)
            .then(project => {
              projectInfo.id = project.id;
              projectInfo.name = project.name;
              return makeFileAsync(project.root_directory);
            })
            .then(tree => {
              if (!tree) {
                return { status: constants.status.ERROR };
              } else {
                projectInfo.rootDirectory = tree;
                return {
                  status: constants.status.OKAY,
                  projectInfo: projectInfo
                };
              }
            });
        }
      })
      .then(callbackValue => callback(callbackValue))
      .catch(err => {
        logger.error(err);
        callback({ status: constants.status.ERROR });
      });
  };
};

/**
 * Constructs a file object
 *
 * Gross callback function because recursive promises are hard
 *
 * @param {string} filepath - the file's path
 * @param {function} callback - signature callback(err, tree) where tree is a {@link file}
 */
function makeFile(filepath, callback) {
  fs.stat(filepath, function(err, stats) {
    if (err) {
      if (err.code === "ENOENT") {
        callback();
      } else {
        callback(err);
      }
    } else {
      const file = {
        path: filepath,
        name: path.basename(filepath),
        size: stats.size,
        type: path.extname(filepath)
      };
      // Check if filepath should be ignored
      for (let i = 0; i < constants.ignoreRgx.length; i++) {
        const rgx = constants.ignoreRgx[i];
        if (filepath.match(rgx)) {
          file.ignored = true;
          if (stats.isDirectory()) {
            file.type = "directory";
          }
          return callback(null, file);
        }
      }
      if (!stats.isDirectory()) {
        // Base case - the file has no children
        callback(null, file);
      } else {
        file.type = "directory";
        fs.readdir(filepath, function(err, files) {
          if (err) {
            callback(err);
          } else {
            if (files.length === 0) {
              // If the directory has no children, return
              callback(null, file);
            } else {
              file.children = [];
              asyncForEach(
                files,
                function(childFile, index, next) {
                  const childFilepath = path.join(filepath, childFile);
                  makeFile(childFilepath, function(err, child) {
                    if (err) {
                      callback(err);
                    } else if (!child) {
                      next();
                    } else {
                      file.children.push(child);
                      next();
                    }
                  });
                },
                function(err) {
                  if (err) {
                    callback(err);
                  } else {
                    callback(null, file);
                  }
                }
              );
            }
          }
        });
      }
    }
  });
}
