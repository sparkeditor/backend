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
const moveCursor = require("./moveCursor");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

/**
 * Interval in milliseconds between syncing client files with server
 * @type {number}
 */
const SYNC_INTERVAL = 3000;

/**
 * An ace cursor
 * @typedef {object} cursor
 * @property {number} row - the cursor's row position
 * @property {number} column - the cursor's column position
 */

/**
 * A client of a file
 * @typedef {object} client
 * @property {cursor} cursor - The client's cursor position in the file
 */

/**
 * A file object
 * @typedef {object} file
 * @property {PieceTable} buffer - The file's buffer
 * @property {object.<string, client>} clients -  Maps client ids to clients
 */

/**
 * The list of files that the server knows about.
 * The keys are filepaths.
 * @typedef {object.<string, file>} files
 */

/**
 * Stores server state
 * @typedef {object} serverState
 * @property {files} files - currently opened buffers
 */
const serverContext = {
    files: {},
    /**
     * Adds a file to the files list
     * @param {string} filepath - The file's filepath
     * @param {PieceTable} buffer - The file's contents represented as a PieceTable
     */
    openFile: function(filepath, buffer) {
        if (!this.files[filepath]) {
            this.files[filepath] = {
                buffer: buffer,
                clients: {}
            };
        }
    },
    /**
     * Deletes a file from the files list
     * @param filepath
     */
    closeFile: function(filepath) {
        delete this.files[filepath];
    },
    hasFile: function(filepath) {
        return this.files[filepath] !== null && this.files[filepath] !== undefined;
    },
    getFileContents: function(filepath) {
        return this.files[filepath].buffer.getSequence();
    },
    /**
     * Adds a new client to a file
     * @param {string} filepath
     * @param {string} clientId
     */
    addClient: function(filepath, clientId) {
        if (this.files[filepath]) {
            this.files[filepath].clients[clientId] = {};
        }
    },
    /**
     * Removes a client from a file.
     * If there are no more clients for that file, deletes the file buffer
     * @param {string} filepath
     * @param {string} clientId
     */
    removeClient: function(filepath, clientId) {
        if (this.files[filepath]) {
            delete this.files[filepath].clients[clientId];
            if (Object.keys(this.files[filepath].clients).length === 0) {
                // The file has no more open clients; we can safely delete it
                this.closeFile(filepath);
            }
        }
    },
    /**
     * True if a file has a client with id clientId
     * @param {string} filepath
     * @param {string} clientId
     */
    fileHasClient: function(filepath, clientId) {
        return this.files[filepath].clients[clientId] !== null && this.files[filepath].clients[clientId] !== undefined;
    },
    /**
     * Sets the cursor position for a client in a file
     * @param {string} filepath
     * @param {string} clientId
     * @param {number} row
     * @param {number} column
     */
    setCursor: function(filepath, clientId, row, column) {
        if (this.files[filepath] && this.files[filepath].clients[clientId]) {
            this.files[filepath].clients[clientId].cursor = {row: row, column: column};
        }
    },
    deleteFromFile(filepath, offset, length) {
        if (this.files[filepath] && this.files[filepath].buffer) {
            this.files[filepath].buffer.delete(offset, length);
        }
    },
    insertIntoFile(filepath, str, offset) {
        if (this.files[filepath] && this.files[filepath].buffer) {
            this.files[filepath].buffer.insert(str, offset);
        }
    }
};

// Logging middleware
io.use((socket, next) => {
    logger.info(`${socket.request.method} ${socket.request.url} ${socket.request.res.statusCode} ${socket.request.res.statusMessage}`);
    next();
});

io.on('connection', function(client) {
    // TODO write a function to validate arbitrary arguments and send an error back to the client if validation fails - look into socketIO Namespace#use()
    // Otherwise, the server will crash if it gets malformed arguments
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
    /**
     * The client moves the cursor
     */
    client.on('moveCursor', moveCursor(client, serverContext));
});

/**
 * Sync client files with server copies
 */
setInterval(() => sync(io, serverContext), SYNC_INTERVAL);

module.exports = server;