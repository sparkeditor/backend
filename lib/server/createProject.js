const auth = require("../auth");
const projectManager = require("../projectManager");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the createProject callback
 * @param {object} client - the socketIO client object
 * @param {object} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       const credentials = data.credentials;
       const projectName = data.projectName;

       auth.authenticate(credentials.username, credentials.password, function(err, hasAccess) {
           if (err) {
               logger.error(err);
               callback({status: constants.status.ERROR});
           }
           else if (!hasAccess) {
               callback({status: constants.status.ACCESS_DENIED});
           }
           else {
               projectManager.createProject({name: projectName}, function(err) {
                   if (err) {
                       logger.error(err);
                       if (err.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: project.name") {
                           callback({status: constants.status.EEXIST});
                       }
                       else {
                           callback({status: constants.status.ERROR});
                       }
                   }
                   else {
                       projectManager.getProject(projectName, function(err, project) {
                           if (err) {
                               logger.error(err);
                               callback({status: constants.status.ERROR});
                           }
                           else {
                               auth.setAccess(credentials.username, project.id, auth.accessLevels.ADMIN, function(err) {
                                   if (err) {
                                       logger.error(err);
                                       callback({status: constants.status.ERROR});
                                   }
                                   else {
                                       callback({status: constants.status.OKAY});
                                   }
                               });
                           }
                       });
                   }
               });
           }
       });
   };
};