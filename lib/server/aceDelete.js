const constants = require("./serverConstants");
const aceHelpers = require("./aceHelpers");

/**
 * Factory function to generate the socketIO delete callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const file = data.file;
        const start = data.start;
        const end = data.end;
        if (serverContext.fileHasClient(file, client.id)) {
            const offset = aceHelpers.offsetFromCoordinates(start, serverContext.getFilePieceTable(file));
            const length = aceHelpers.lengthFromCoordinates(start, end, serverContext.getFilePieceTable(file));
            serverContext.deleteFromFile(file, offset, length);
            client.broadcast.emit('delete', {file: file, offset: offset, length: length});
            client.broadcast.emit('aceDelete', {file: file, start: start, end: end});
            callback({status: constants.status.OKAY});
        }
        else {
            callback({status: constants.status.ACCESS_DENIED});
        }
    };
};