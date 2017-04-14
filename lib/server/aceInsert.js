const constants = require("./serverConstants");
const aceHelpers = require("./aceHelpers");

/**
 * Factory function to generate the insert socketIO callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
  return function(data, callback) {
    const file = data.file;
    const start = data.start;
    const lines = data.lines;
    if (serverContext.fileHasClient(file, client.id)) {
      const str = aceHelpers.strFromLines(lines);
      const offset = aceHelpers.offsetFromCoordinates(
        start,
        serverContext.getFilePieceTable(file)
      );
      serverContext.insertIntoFile(file, str, offset);
      // TODO standardize emitting events to relevant clients - use the client list to figure out which clients care about insert, delete, remove, create, createDir
      client.broadcast.emit("insert", { file: file, str: str, offset: offset });
      client.broadcast.emit("aceInsert", {
        file: file,
        text: str,
        position: start
      });
      callback({ status: constants.status.OKAY });
    } else {
      callback({ status: constants.status.ACCESS_DENIED });
    }
  };
};
