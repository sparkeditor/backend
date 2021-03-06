const constants = require("./serverConstants");
const auth = require("../auth");
const logger = require("../logger");

/**
 * Factory function to generate the socketIO createUser callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const username = data.username;
        const password = data.password;
        auth
            .addUser({ username: username, password: password })
            .then(() => callback({ status: constants.status.OKAY }))
            .catch(err => {
                if (
                    err.message ===
                    "SQLITE_CONSTRAINT: UNIQUE constraint failed: user.username"
                ) {
                    callback({ status: constants.status.EEXIST });
                } else {
                    logger.error(err);
                    callback({ status: constants.status.ERROR });
                }
            });
    };
};
