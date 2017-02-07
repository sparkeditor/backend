const constants = require("./serverConstants");

/**
 * Factory function to generate the socketIO delete callback
 * @param {object} client - The socketIO client object
 * @param {object} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const file = data.file;
        const offset = data.offset;
        const length = data.length;
        if (serverContext.clients[client.id].indexOf(file) !== -1) {
            serverContext.buffers[file].delete(offset, length);
            client.broadcast.emit('delete', {file: file, offset: offset, length: length});
            callback({status: constants.status.OKAY});
        }
        else {
            callback({status: constants.status.ACCESS_DENIED});
        }
    };
};