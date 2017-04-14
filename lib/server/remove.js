const auth = require("../auth");
const projectManager = require("../projectManager");
const fileIO = require("../fileIO");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the remove callback
 * @param {object} client - the socketIO client
 * @param {serverContext} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
  return function(data, callback) {
    const credentials = data.credentials;
    const file = data.file;
    projectManager
      .getProjectForFile(file)
      .then(projectId => [
        auth.authenticate(
          credentials.username,
          credentials.password,
          projectId
        ),
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
          return fileIO
            .delete(file)
            .then(() => {
              client.broadcast.emit("remove", { file: file });
              return { status: constants.status.OKAY };
            })
            .catch(err => {
              if (err.code === "ENOENT") {
                return { status: constants.status.ENOENT };
              } else {
                throw err;
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
