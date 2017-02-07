const constants = require("./serverConstants");

module.exports = function(client, serverContext) {
   return function(data, callback) {
       const file = data.file;
       const str = data.str;
       const offset = data.offset;
       if (serverContext.clients[client.id].indexOf(file) != -1) {
           serverContext.buffers[file].insert(str, offset);
           // TODO standardize emitting events to relevant clients - use the client list to figure out which clients care about insert, delete, remove, create, createDir
           client.broadcast.emit('insert', {file: file, str: str, offset: offest});
           callback({status: constants.status.OKAY});
       }
       else {
           callback({status: constants.status.ACCESS_DENIED});
       }
   };
};