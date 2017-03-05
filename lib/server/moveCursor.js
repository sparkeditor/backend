const constants = require("./serverConstants");

/**
 * Factory function to generate the socketIO moveCursor callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const cursor = data.cursor;
        const file = data.file;
        if (serverContext.clients[client.id] && serverContext.clients[client.id][file]) {
            serverContext.clients[client.id][file].cursor = cursor;
            client.broadcast.emit('moveCursor', {client: client.id, file: file, cursor: cursor})
            callback({status: constants.status.OKAY});
        }
        else {
            callback({status: constants.status.ERROR});
        }
    };
};