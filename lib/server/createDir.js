const Promise = require("bluebird");
const path = require("path");
const auth = require("../auth");
const projectManager = require("../projectManager");
const fileIO = require("../fileIO");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the createDir callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
  return function(data, callback) {
    const credentials = data.credentials;
    const projectId = data.projectId;
    // directory is a path relative to the project root directory
    const directory = data.directory;
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
          return projectManager
            .getProject(projectId)
            .then(project =>
              path.resolve(path.join(project.root_directory, directory))
            )
            .then(filepath => fileIO.createDir(filepath))
            .then(() => {
              client.broadcast.emit("createDir", {
                directory: directory,
                projectId: projectId
              });
              return { status: constants.status.OKAY };
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
