
const getUserByEmail = (email, users) => {
  for (const userKey in users) {
    if (users[userKey]['email'] == email) {
      return users[userKey];
    }
  }
  return undefined;
}

const getUniqueVisitorCountByLog = (log) => {
  const result = new Set();
  for (oneLog of log) {
    result.add(oneLog['visitor_id']);
  }
  return result.size;
}

module.exports = { getUserByEmail, getUniqueVisitorCountByLog}