const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const authorize = require("./authorize");
const openProject = require("./openProject");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

/**
 * Stores server state
 * @type {object}
 */
const serverContext = {
    /** Currently opened buffers */
    buffers: {},
    /** Currently connected clients */
    clients: {}
};

io.on('connection', function(client) {
    /**
     * The client attempts to authorize to the server
     */
    client.on('authorize', authorize(client, serverContext));
    /**
     * The client attempts to open a project
     */
    client.on('openProject', openProject(client, serverContext));
});

module.exports = server;