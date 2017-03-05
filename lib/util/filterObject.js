/**
 * Filters an object by returning a new object only containing keys where condition(key) == true
 * @param {object} obj - The object to filter
 * @param {Function} condition - The condition function
 * @returns {object} - The filtered object
 */
module.exports = function(obj, condition) {
    const filtered = {};
    for (let key in obj) {
        if (!obj.hasOwnProperty(key)) {
            continue;
        }
        if (condition(key)) {
            filtered[key] = obj[key];
        }
    }
    return filtered;
};