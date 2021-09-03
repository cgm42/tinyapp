/**
 * Returns an object that contains the user's url data
 *
 * @param {string} email
 * @param {object} users - 'database' with users' info
 * @returns {object} Returns an object that contains the user's url data; the user's
 * email matching the parameter
 */
const getUserByEmail = (email, users) => {
  for (const userKey in users) {
    if (users[userKey]['email'] == email) {
      return users[userKey];
    }
  }
  return undefined;
}

/**
 * Returns a count of unique visitors in the log
 *
 * @param {array} log - log property of an URL
 * @returns {number} - Returns a count of unique visitors in the log
 */
const getUniqueVisitorCountByLog = (log) => {
  const result = new Set();
  for (oneLog of log) {
    result.add(oneLog['visitor_id']);
  }
  return result.size;
}



module.exports = { getUserByEmail, getUniqueVisitorCountByLog}