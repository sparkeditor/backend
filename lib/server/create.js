const Promise = require("bluebird");
const path = require("path");
const auth = require("../auth");
const fileIO = require("../fileIO");
const projectManager = require("../projectManager");
const logger = require("../logger");
const PieceTable = require("../pieceTable");
const constants = require("./serverConstants");

/**
 * Factory function to generate the socketIO create callback
 * @param {object} client - The socketIO client object
 * @param {object} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const credentials = data.credentials;
        const projectId = data.projectId;
        // file is path relative to the project root
        const file = data.file;
        Promise.all([auth.authenticate(credentials.username, credentials.password, projectId), auth.getAccess(credentials.username, projectId)])
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
                    return projectManager.getProject(projectId)
                        .then((project) => path.resolve(path.join(project.root_directory, file)))
                        .then((filepath) => Promise.all([filepath, fileIO.write(filepath, "")]))
                        .spread((filepath, _) => {
                            serverContext.buffers[filepath] = new PieceTable("");
                            serverContext.clients[client.id].push(filepath);
                            client.broadcast.emit('create', {file: file, projectId: projectId});
                            return {status: constants.status.OKAY};
                        })
                }
            })
            .then((callbackValue) => callback(callbackValue))
            .catch((err) => {
                logger.error(err);
                callback({status: constants.status.ERROR});
            })
    };
};