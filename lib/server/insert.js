const constants = require("./serverConstants");

/**
 * Factory function to generate the insert socketIO callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       const file = data.file;
       const str = data.str;
       const offset = data.offset;
       if (serverContext.fileHasClient(file, client.id)) {
           serverContext.insertIntoFile(file, str, offset);
           // TODO standardize emitting events to relevant clients - use the client list to figure out which clients care about insert, delete, remove, create, createDir
           client.broadcast.emit('insert', {file: file, str: str, offset: offest});
           callback({status: constants.status.OKAY});
       }
       else {
           callback({status: constants.status.ACCESS_DENIED});
       }
   };
};