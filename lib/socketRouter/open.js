const projectManager = require("../projectManager");
const auth = require("../auth");
const logger = require("../logger");
const PieceTable = require("../pieceTable");
const fileIO = require("../fileIO");
const constants = require("./serverConstants");

/**
 * Factory function to generate the open callback
 * @param {object} client - the socketIO client object
 * @param {object} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       const credentials = data.credentials;
       const file = data.file;
       projectManager.getProjectForFile(file, function(err, projectId) {
           if (err) {
               logger.error(err);
               callback({status: constants.status.ERROR});
           }
           else if (!projectId) {
               // If the file doesn't exist in any project, return ACCESS_DENIED to avoid giving up filesystem info
               callback({status: constants.status.ACCESS_DENIED});
           }
           else {
               auth.authenticate(credentials.username, credentials.password, projectId, function(err, hasAccess) {
                   if (err) {
                       logger.error(err);
                       callback({status: constants.status.ERROR});
                   }
                   else if (!hasAccess) {
                       callback({status: constants.status.ACCESS_DENIED});
                   }
                   else {
                       serverContext.clients[client.id].push(file);
                       if (!serverContext.buffers[file]) {
                           fileIO.read(file, function(err, contents) {
                               if (err) {
                                   logger.error(err);
                                   callback({status: constants.status.ERROR});
                               }
                               else {
                                   serverContext.buffers[file] = new PieceTable(contents);
                                   callback({status: constants.status.OKAY, buffer: serverContext.buffers[file]});
                               }
                           });
                       }
                       else {
                           callback({status: constants.status.OKAY, buffer: serverContext.buffers[file]});
                       }
                   }
               });
           }
       });
   };
};