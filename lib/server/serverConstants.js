/** Constants for use by the socket router */
module.exports = {
    /** Status responses */
    status: {
        ERROR: "SERVER_ERROR",
        OKAY: "OK",
        ACCESS_DENIED: "ACCESS_DENIED",
        EEXIST: "ENTITY_ALREADY_EXISTS"
    },
    ignoreRgx: [
        /node_modules$/,
        /\.git$/,
        /\.idea$/
    ]
};