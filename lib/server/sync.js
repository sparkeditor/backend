const projectManager = require("../projectManager");
const auth = require("../auth");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the sync callback
 * @param {object} client - the socketIO client object
 * @param {serverContext} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
  return function(data, callback) {
    const credentials = data.credentials;
    const file = data.file;
    projectManager
      .getProjectForFile(file)
      .then(projectId => {
        if (!projectId) {
          return false;
        } else {
          return [
            auth.authenticate(
              credentials.username,
              credentials.password,
              projectId
            ),
            auth.getAccess(credentials.username, projectId)
          ];
        }
      })
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
          if (!serverContext.hasFile(file)) {
            return { status: constants.status.ENOENT };
          } else {
            return {
              status: constants.status.OKAY,
              contents: serverContext.getFileContents(file)
            };
          }
        }
      })
      .then(callbackValue => callback(callbackValue))
      .catch(err => {
        logger.error(err);
        callback({ status: constants.status.ERROR });
      });
  };
};
