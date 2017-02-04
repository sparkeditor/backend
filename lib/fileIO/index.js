const Promise = require("bluebird");
const fs = require("fs");
const pathModule = require("path");
const rimraf = require("rimraf");
const mkdirp = require("mkdirp");

Promise.promisifyAll(fs);
const mkdirpAsync = Promise.promisify(mkdirp);
const rimrafAsync = Promise.promisify(rimraf);

/**
 * This module exposes functions to read, write, and delete files and directories
 */
module.exports = {
    /**
     * Reads the contents of a file
     *
     * @param {string} path - The path of the file to read
     * @returns {Promise} - A promise with the file contents or an error
     */
    read: function(path) {
        return fs.readFileAsync(path, "utf8")
    },

    /**
     * Reads the contents of a file synchronously
     *
     * @param {string} path - The path of the file to read
     * @returns {string} - The file contents
     */
    readSync: function(path) {
        return fs.readFileSync(path, "utf8");
    },

    /**
     * Writes to a file. If the file exists it is overwritten.
     *
     * @param {string} path - The path of the file to write to
     * @param {string} text - The text to write to the file
     * @returns {Promise} - A promise that resolves when the text is written, or with an error
     */
    write: function(path, text, callback) {
        return fs.writeFileAsync(path, text)
            .catch(function(err) {
                if (err.code === "ENOENT") {
                    return mkdirpAsync(pathModule.dirname(path))
                        .then(fs.writeFileAsync(path, text))
                }
            });
    },

    /**
     * Creates a new directory.
     * If the directory already exists, it fails silently.
     * If path contains multiple directories, they will be
     * created recursively (like mkdir -p).
     *
     * @param {string} path - The path of the directory to create
     * @returns {Promise} - Resolves when the directory is created, or with an error
     */
    createDir: function(path) {
        return mkdirpAsync(path);
    },

    /**
     * Creates a new directory synchronously using mkdir -p
     * @param {string} path - The path of the directory to create
     */
    createDirSync: function(path) {
        mkdirp.sync(path);
    },

    /**
     * Deletes a file or directory
     *
     * @param {string} path - The path of the file or directory to delete
     * @returns {Promise} - Resolves when the file or directory is deleted, or with an error
     */
    delete: function(path, callback) {
        return fs.statAsync(path)
            .then(function (stats) {
                if (stats.isDirectory()) {
                    return rimrafAsync(path);
                }
                else {
                    return fs.unlinkAsync(path)
                }
            });
    }
};