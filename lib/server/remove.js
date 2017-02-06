const auth = require("../auth");
const projectManager = require("../projectManager");
const fileIO = require("../fileIO");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the remove callback
 * @param {object} client - the socketIO client
 * @param {object} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       const credentials = data.credentials;
       const file = data.file;
       projectManager.getProjectForFile(file)
           .then((projectId) => auth.authenticate(credentials.username, credentials.password, projectId))
           .then((hasAccess) => {
               if (!hasAccess) {
                   return false;
               }
               else {
                   return auth.getAccess(credentials.username, projectId).then((accessLevel) => (accessLevel !== auth.accessLevels.CONTRIBUTOR && accessLevel !== auth.accessLevels.ADMIN));
               }
           })
           .then((hasAccess) => {
               if (!hasAccess) {
                   return constants.status.ACCESS_DENIED;
               }
               else {
                   return fileIO.delete(file).then(() => constants.status.OKAY);
               }
           })
           .then((status) => callback({status: status}))
           .catch((err) => {
               logger.error(err);
               callback({status: constants.status.ERROR});
           });
   }
};