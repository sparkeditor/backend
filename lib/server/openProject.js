const fs = require("fs");
const path = require("path");
const asyncForEach = require("async-for-each");
const auth = require("../auth");
const projectManager = require("../projectManager");
const logger = require("../logger");
const constants = require("./serverConstants");

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
 * @param {object} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       const credentials = data.credentials;
       const projectId = data.projectId;

       auth.authenticate(credentials.username, credentials.password, projectId, function(err, hasAccess) {
            if (err) {
                logger.error(err);
                callback({status: constants.status.ERROR})
            }
            else if (!hasAccess) {
                callback({status: constants.status.ACCESS_DENIED});
            }
            else {
                /** @type {projectInfo} */
                const projectInfo = {};
                projectManager.getProject(projectId, function(err, project) {
                    if (err) {
                        logger.error(err);
                        callback({status: constants.status.ERROR});
                    }
                    else {
                        projectInfo.id = project.id;
                        projectInfo.name = project.name;
                        makeFile(project.root_directory, function(err, tree) {
                            if (err) {
                                logger.error(err);
                                callback({status: constants.status.ERROR});
                            }
                            else {
                                projectInfo.rootDirectory = tree;
                                callback({
                                    status: constants.status.OKAY,
                                    projectInfo: projectInfo
                                });

                            }
                        });
                    }

                });
            }
       });
   };
};

/**
 * Constructs a file object
 * @param {string} filepath - the file's path
 * @param {function} callback - signature callback(err, tree) where tree is a {@link file}
 */
function makeFile(filepath, callback) {
    fs.lstat(filepath, function(err, stats) {
        if (err) {
            callback(err);
        }
        else {
            const file = {
                path: filepath,
                name: path.basename(filepath),
                size: stats.size,
                type: path.extname(filepath)
            };
            if (!stats.isDirectory()) {
                // Base case - the file has no children
                callback(null, file);
            }
            else {
                file.type = "directory";
                fs.readdir(filepath, function(err, files) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (files.length === 0) {
                            // If the directory has no children, return
                            callback(null, file);
                        }
                        else {
                            file.children = [];
                            asyncForEach(files, function(childFilepath, index, next) {
                                makeFile(childFilepath, function(err, childFile) {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        file.children.push(childFile);
                                        next();
                                    }
                                });
                            }, function(err) {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    callback(null, file);
                                }
                            });
                        }
                    }
                });
            }
        }
    });
}