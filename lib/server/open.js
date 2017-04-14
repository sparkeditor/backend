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
    return function(data, callback) {
        const credentials = data.credentials;
        const file = data.file;
        projectManager
            .getProjectForFile(file)
            .then(projectId => {
                if (!projectId) {
                    return false;
                } else {
                    return [
                        auth.authenticate(
                            credentials.username,
                            credentials.password,
                            projectId
                        ),
                        auth.getAccess(credentials.username, projectId)
                    ];
                }
            })
            .spread((hasAccess, accessLevel) => {
                if (!hasAccess) {
                    return false;
                } else {
                    return (
                        accessLevel === auth.accessLevels.CONTRIBUTOR ||
                        accessLevel === auth.accessLevels.ADMIN
                    );
                }
            })
            .then(hasAccess => {
                if (!hasAccess) {
                    return { status: constants.status.ACCESS_DENIED };
                } else {
                    if (!serverContext.hasFile(file)) {
                        return fileIO
                            .read(file)
                            .then(contents => {
                                serverContext.openFile(
                                    file,
                                    new PieceTable(contents)
                                );
                                serverContext.addClient(file, client.id);
                                client.broadcast.emit("open", {
                                    file: file,
                                    username: serverContext.getUsername(
                                        client.id
                                    )
                                });
                                return {
                                    status: constants.status.OKAY,
                                    contents: contents,
                                    clients: null
                                };
                            })
                            .catch(err => {
                                if (err.code === "ENOENT") {
                                    return { status: constants.status.ENOENT };
                                } else {
                                    throw err;
                                }
                            });
                    } else {
                        const clients = {};
                        const serverClients = serverContext.getClients(file);
                        for (let client in serverClients) {
                            if (!serverClients.hasOwnProperty(client)) {
                                continue;
                            }
                            clients[serverContext.getUsername(client)] = {
                                cursor: serverClients[client].cursor
                            };
                        }
                        serverContext.addClient(file, client.id);
                        client.broadcast.emit("open", {
                            file: file,
                            username: serverContext.getUsername(client.id)
                        });
                        return {
                            status: constants.status.OKAY,
                            contents: serverContext.getFileContents(file),
                            clients: clients
                        };
                    }
                }
            })
            .then(callbackValue => callback(callbackValue))
            .catch(err => {
                logger.error(err);
                callback({ status: constants.status.ERROR });
            });
    };
};
