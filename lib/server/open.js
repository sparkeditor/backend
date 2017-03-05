const projectManager = require("../projectManager");
const auth = require("../auth");
const logger = require("../logger");
const PieceTable = require("../pieceTable");
const fileIO = require("../fileIO");
const constants = require("./serverConstants");

/**
 * Factory function to generate the open callback
 * @param {object} client - the socketIO client object
 * @param {serverContext} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function (data, callback) {
        const credentials = data.credentials;
        const file = data.file;
        projectManager.getProjectForFile(file)
            .then((projectId) => {
                if (!projectId) {
                    return false;
                }
                else {
                    return [auth.authenticate(credentials.username, credentials.password, projectId), auth.getAccess(credentials.username, projectId)]
                }
            })
            .spread((hasAccess, accessLevel) => {
                if (!hasAccess) {
                    return false;
                }
                else {
                    return (accessLevel === auth.accessLevels.CONTRIBUTOR || accessLevel === auth.accessLevels.ADMIN);
                }
            })
            .then((hasAccess) => {
                if (!hasAccess) {
                    return {status: constants.status.ACCESS_DENIED};
                }
                else {
                    serverContext.clients[client.id][file] = {};
                    if (!serverContext.buffers[file]) {
                        return fileIO.read(file)
                            .then((contents) => {
                                serverContext.buffers[file] = new PieceTable(contents);
                                return {status: constants.status.OKAY, contents: contents};
                            })
                    }
                    else {
                        return {status: constants.status.OKAY, contents: serverContext.buffers[file].getSequence()};
                    }
                }
            })
            .then((callbackValue) => callback(callbackValue))
            .catch((err) => {
                logger.error(err);
                callback({status: constants.status.ERROR});
            });
    };
};