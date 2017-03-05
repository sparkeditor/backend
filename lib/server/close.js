const constants = require("./serverConstants");

/**
 * Factory function to generate the close callback
 * @param {object} client - the socketIO client object
 * @param {serverContext} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       const file = data.file;
       if (serverContext.fileHasClient(file, client.id)) {
           serverContext.removeClient(file, client.id);
       }
       callback({status: constants.status.OKAY});
   }
};