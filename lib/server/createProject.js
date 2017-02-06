const auth = require("../auth");
const projectManager = require("../projectManager");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the createProject callback
 * @param {object} client - the socketIO client object
 * @param {object} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const credentials = data.credentials;
        const projectName = data.projectName;

        auth.authenticate(credentials.username, credentials.password)
            .then((hasAccess) => {
                if (!hasAccess) {
                    callback({status: constants.status.ACCESS_DENIED});
                }
                else {
                    projectManager.createProject({name: projectName})
                        .then(() => projectManager.getProject(projectName))
                        .then(() => auth.setAccess(credentials.username, auth.accessLevels.ADMIN))
                        .then(() => {
                            callback({status: constants.status.OKAY});
                        })
                        .catch((err) => {
                            if (err.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: project.name") {
                                callback({status: constants.status.EEXIST});
                            }
                            else {
                                logger.error(err);
                                callback({status: constants.status.ERROR});
                            }
                        });
                }
            })
            .catch((err) => {
                logger.error(err);
                callback({status: constants.status.OKAY});
            });
    };
};