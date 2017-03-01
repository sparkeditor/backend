const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const logger = require("../logger");

const authorize = require("./authorize");
const createUser = require("./createUser");
const getUsers = require("./getUsers");
const addUserToProject = require("./addUserToProject");
const openProject = require("./openProject");
const createProject = require("./createProject");
const open = require("./open");
const close = require("./close");
const remove = require("./remove");
const create = require("./create");
const createDir = require("./createDir");
const insert = require("./insert");
const deleteCallback = require("./delete");
const write = require("./write");
const sync = require("./sync");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

/**
 * Interval in milliseconds between syncing client files with server
 * @type {number}
 */
const SYNC_INTERVAL = 3000;

/**
 * Stores server state
 * @type {object}
 */
const serverContext = {
    /** Currently opened buffers */
    buffers: {},
    /** Currently connected authorized clients */
    clients: {}
};

// Logging middleware
io.use((socket, next) => {
    logger.info(`${socket.request.method} ${socket.request.url} ${socket.request.res.statusCode} ${socket.request.res.statusMessage}`);
    next();
});

io.on('connection', function(client) {
    // TODO write a function to validate arbitrary arguments and send an error back to the client if validation fails - look into socketIO Namespace#use()
    /**
     * The client attempts to authorize to the server
     */
    client.on('authorize', authorize(client, serverContext));
    /**
     * The client creates a new user
     */
    client.on('createUser', createUser(client, serverContext));
    /**
     * The client asks for a list of users
     */
    client.on('getUsers', getUsers(client, serverContext));
    /**
     * The client attempts to add a user to a project
     */
    client.on('addUserToProject', addUserToProject(client, serverContext));
    /**
     * The client attempts to open a project
     */
    client.on('openProject', openProject(client, serverContext));
    /**
     * The client attempts to create a new project
     */
    client.on('createProject', createProject(client, serverContext));
    /**
     * The client attempts to open a file
     */
    client.on('open', open(client, serverContext));
    /**
     * The client closes a file
     */
    client.on('close', close(client, serverContext));
    /**
     * The client attempts to remove a file
     */
    client.on('remove', remove(client, serverContext));
    /**
     * The client attempts to create a file
     */
    client.on('create', create(client, serverContext));
    /**
     * The client attempts to create a directory
     */
    client.on('createDir', createDir(client, serverContext));
    /**
     * The client inserts into a buffer
     */
    client.on('insert', insert(client, serverContext));
    /**
     * The client deletes from a buffer
     */
    client.on('delete', deleteCallback(client, serverContext));
    /**
     * The client writes a buffer to disk
     */
    client.on('write', write(client, serverContext));
});

/**
 * Sync client files with server copies
 */
setInterval(() => sync(io, serverContext), SYNC_INTERVAL);

module.exports = server;