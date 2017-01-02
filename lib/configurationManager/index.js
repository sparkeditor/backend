/**
 * This module exposes an API to access values from config files.
 * Currently, only JSON-formatted config files are supported.
 */

const fileIO = require("../fileIO");

/**
 * Caches configurations. The keys are the paths to the configuration,
 * and the values are the config objects.
 * @private
 * @type {Object.<string, object>}
 */
const configurationCache = {};

/**
 * Loads a configuration file
 * @private
 * @param {string} path - The path of the config file
 * @returns {Object.<string, string>} - The config key/value pairs as an object, or
 *                                      undefined if the config file does not exist
 *                                      or is invalid
 */
const loadConfigFile = function(path) {
    try {
        const configText = fileIO.read(path);
        const config = JSON.parse(configText);
        configurationCache[path] = config;
        return config;
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return undefined;
        }
        else if (error instanceof SyntaxError) {
            return undefined;
        }
        else {
            throw error;
        }
    }
};

/**
 * The ConfigurationManager constructor
 * @constructor ConfigurationManager
 * @param {string} configPath - The path to the configuration file
 */
const configurationManager = function(configPath) {
    let config;

    if(configurationCache[configPath]) {
        config = configurationCache[configPath];
    }
    else {
        config = loadConfigFile(configPath);
    }

    /**
     * Gets a config value
     * @param {string} key - The key to return the value of
     * @param {string} [defaultValue] - A default value to return if the key or the config file is invalid
     * @returns The value attached to the key, or the default value, or undefined
     */
    this.getValue = function(key, defaultValue) {
        if (!config) {
            return defaultValue;
        }
        const value = config[key];
        if (value) {
            return value;
        }
        else {
            return defaultValue;
        }
    };
};

module.exports = configurationManager;