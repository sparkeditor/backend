const PieceTable = require("../pieceTable");

/**
 * Stores all buffers. The key is the buffer name, and the value is a PieceTable
 * @type {Object.<string, PieceTable>}
 */
const buffers = {};

/**
 * This module stores a list of all open buffers and exposes accessor methods
 * @module BufferManager
 */
module.exports = {
    /**
     * Creates a new buffer
     * @param {string} bufferName - The name of the buffer to be created
     * @param {string} [initialText] - Initial buffer text
     * @throws Throws an error if a buffer with that names already exists
     * @returns {PieceTable} The created buffer
     */
    createBuffer: function(bufferName, initialText) {
        if (buffers[bufferName]) {
            throw new Error("A buffer named " + bufferName + " already exists.");
        }
        buffers[bufferName] = new PieceTable(initialText);
        return buffers[bufferName];
    },

    /**
     * Gets a buffer
     * @param {string} bufferName - The name of the buffer to get
     * @returns {PieceTable} The requested buffer, or undefined if it does not exist
     */
    getBuffer: function(bufferName) {
        return buffers[bufferName];
    },

    /**
     * Deletes a buffer
     * @param {string} bufferName - The buffer to delete
     * @throws Throws an error if the buffer does not exist
     */
    deleteBuffer: function(bufferName) {
        if (!buffers[bufferName]) {
            throw new Error("No buffer named " + bufferName + " exists.");
        }
        delete buffers[bufferName];
    }
};