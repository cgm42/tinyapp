const { assert } = require('chai');

const { getUserByEmail, getUniqueVisitorCountByLog } = require('../helper.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const log = [
  { timestamp: "2021-09-02T23:07:01.976Z", visitor_id: 'lmFOgr' },
  { timestamp: "2021-09-02T23:12:47.104Z", visitor_id: 'lmFOgr' },
  { timestamp: "2021-09-02T23:13:09.727Z", visitor_id: '8LBV9k' },
  { timestamp: "2021-09-02T23:13:42.781Z", visitor_id: 'cZQoNO' },
  { timestamp: "2021-09-02T23:14:20.610Z", visitor_id: 'lmFOgr' }
];

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.equal(user['id'], expectedOutput);
  });

  it('should return undefined with invalid email', function() {
    const user = getUserByEmail("user@exasdfmple.com", testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });

});

describe('getUniqueVisitorCountByLog', function() {
  it('should return number of unique visitors', function() {
    const expectedOutput = 3;
    assert.equal(getUniqueVisitorCountByLog(log), expectedOutput);
  });

  it('should return zero on empty input', function() {
    const expectedOutput = 0;
    assert.equal(getUniqueVisitorCountByLog([]), expectedOutput);
  });


});

