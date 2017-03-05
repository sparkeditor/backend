const Promise = require("bluebird");
const constants = require("./serverConstants");
const database = require("../database");
const logger = require("../logger");

/**
 * Factory function to generate the socketIO getUsers callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       // query is a string to match usernames against
       const query = data.query || "";
       const sql = "SELECT * FROM user WHERE username LIKE '%" + query + "%'"
       new Promise(function(resolve, reject) {
           database.getDB().all(sql, (err, rows) => {
               if (err) {
                   reject(err);
               }
               else {
                   resolve(rows);
               }
           });
       })
           .then((users) => callback({users: users, status: constants.status.OKAY}))
           .catch((err) => {
               logger.error(err);
               callback({status: constants.status.ERROR});
           });
   };
};