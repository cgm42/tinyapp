
const getUserByEmail = (email, users) => {
  for (const userKey in users) {
    if (users[userKey]['email'] == email) {
      return users[userKey];
    }
  }
  return undefined;
}



module.exports = { getUserByEmail,}