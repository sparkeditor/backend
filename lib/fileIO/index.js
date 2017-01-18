const fs = require("fs");
const pathModule = require("path");
const rimraf = require("rimraf");
const mkdirp = require("mkdirp");

/**
 * This module exposes functions to read, write, and delete files and directories
 */
module.exports = {
    /**
     * Reads the contents of a file
     *
     * @param {string} path - The path of the file to read
     * @param {function} [callback] - An optional callback. If used, it is called with the
     *                                following signature: callback(error, data)
     * @returns The file contents if callback is not specified, otherwise undefined (and the data is
     *          accessible from the callback).
     */
    read: function(path, callback) {
        if (!callback) {
            return fs.readFileSync(path, "utf8");
        }
        else {
            fs.readFile(path, "utf8", function(error, data) {
                callback(error, data);
            });
        }
    },

    /**
     * Writes to a file. If the file exists it is overwritten.
     *
     * @param {string} path - The path of the file to write to
     * @param {string} text - The text to write to the file
     * @param {function} [callback] - An optional callback. If used, it is called with the
     *                                following signature: callback(error)
     */
    write: function(path, text, callback) {
        if (!callback) {
            try {
                fs.writeFileSync(path, text);
            }
            catch (e) {
                if (e.code === "ENOENT") {
                    mkdirp.sync(pathModule.dirname(path));
                    fs.writeFileSync(path, text);
                }
                else {
                    throw e;
                }
            }
        }
        else {
            fs.writeFile(path, text, function(error) {
                if (error && error.code === "ENOENT") {
                    mkdirp(pathModule.dirname(path), function(err) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            fs.writeFile(path, text, function(error) {
                                callback(error);
                            });
                        }
                    });
                }
                else {
                    callback(error);
                }
            });
        }
    },

    /**
     * Creates a new directory.
     * If the directory already exists, it fails silently.
     * If path contains multiple directories, they will be
     * created recursively (like mkdir -p).
     *
     * @param {string} path - The path of the directory to create
     * @param {function} [callback] - An optional callback. If used, it is called with the
     *                                following signature: callback(error)
     */
    createDir: function(path, callback) {
        if(!callback) {
            mkdirp.sync(path);
        }
        else {
            mkdirp(path, function(error) {
                callback(error);
            });
        }
    },

    /**
     * Deletes a file or directory
     *
     * @param {string} path - The path of the file or directory to delete
     * @param {function} callback - An optional callback. If used, it is called with the
     *                              following signature: callback(error)
     */
    delete: function(path, callback) {
        if (!callback) {
            const stats = fs.statSync(path);
            if (stats.isDirectory()) {
                rimraf.sync(path);
            }
            else {
                fs.unlinkSync(path);
            }
        }
        else {
            fs.stat(path, function(error, stats) {
                if (error) {
                    callback(error);
                }
                else {
                    if (stats.isDirectory()) {
                        rimraf(path, function(error) {
                            callback(error);
                        });
                    }
                    else {
                        fs.unlink(path, function(error) {
                            callback(error);
                        });
                    }
                }
            });
        }
    }
};