const constants = require("./serverConstants");
const fileIO = require("../fileIO");
const logger = require("../logger");

/**
 * Factory function to generate the socketIO write callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       const file = data.file;
       if (serverContext.clients[client.id][file]) {
           fileIO.write(file, serverContext.buffers[file])
               .then(() => {
                   client.broadcast.emit('write', {file: file});
                   callback({status: constants.status.OKAY});
               })
               .catch((err) => {
                   logger.error(err);
                   callback({status: constants.status.ERROR});
               })
       }
       else {
           callback({status: constants.status.ACCESS_DENIED});
       }
   };
};