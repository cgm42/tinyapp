const cookieSession = require('cookie-session');
const express = require("express");
const methodOverride = require('method-override');
const app = express();
const morgan = require('morgan');
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {getUserByEmail, getUniqueVisitorCountByLog} = require('./helper')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["meowmIsHere"],
}));
app.use(methodOverride('_method'));
app.use(morgan('dev'));

const urlDatabase = {
  "b2xVn2": {longURL:"http://www.cbc.ca",
             userID: "user2RandomID",
             date: "2021-09-01",
             totalVisit: 0,
             log: [],},
  "9sm5xK": {longURL:"http://www.oku.club",
             userID: "lmFOgr",
             date: "2021-08-31",
             totalVisit: 0,
             log: [],},
  "8as3xW": {longURL:"http://www.npr.org",
            userID: "lmFOgr",
            date: "2021-09-02",
            totalVisit: 0,
            log: [],},
};

const users = {
  "lmFOgr": {
    id: "lmFOgr", 
    email: "qwe@qwe", 
    password: "$2b$10$hMCnZwaMCxEGHi9bRQVKZOeUjsI74DNt3ah455Wao9c9mCy0osUjC"
  },
 
}

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  return res.redirect('/urls');
})

//retrieve long URL page for any user with valid link
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL] === undefined) res.status(404).send('URL not found');
  urlDatabase[shortURL]['totalVisit'] += 1;
  if (!req.session.user_id) {
    req.session.user_id = generateRandomString();
  }
  const tempVar = {
    timestamp: new Date(),
    visitor_id: req.session.user_id,
  }
  urlDatabase[shortURL]['log'].push(tempVar);
  console.log(urlDatabase[shortURL]);
  res.redirect(`${urlDatabase[shortURL]['longURL']}`);
});

//retrive the main url listing page
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const userURLDatabase = urlsForUser(user_id);
  res.render('urls_index', {
    userURLDatabase,
    user: users[user_id],
    getUniqueVisitorCountByLog,
  });
});

//retrieve the page to create a new URL
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id === undefined || !lookUpUserById(user_id)) {
    return res.redirect('/login');
  }
  res.render('urls_new', {
    user: users[req.session.user_id],
  });
});

//retrieve the page to edit an existing URL
app.get("/urls/:shortURL", (req, res) => {
  
  //send error msg if user is not logged in
  if (!req.session.user_id) {
    return res.status(`401`).send('<html><h1>Not logged in<h1><html>');
  }
  //send error msg if the link does not exist in database
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(`401`).send('<h1>Invalid URL<h1>');
  }
  //send error msg if the link does not belong to user
  if (req.session.user_id !== urlDatabase[req.params.shortURL]['userID']) {
    return res.status(`401`).send('<h1>Access only granted to URL creator<h1>');  
  }
   const templateVars = {
    urlShort: req.params.shortURL,
    urlObj: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id],
    getUniqueVisitorCountByLog,
   }
  res.render('urls_show', templateVars);
});

//retrieve the registration page
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id !== undefined && lookUpUserById(user_id)) {
    return res.redirect('/urls');
  }
    res.render('register', {
    user: users[req.session.user_id],
  });
});

//retrieve the login page
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id !== undefined && lookUpUserById(user_id)) {
    return res.redirect('/urls');
  }
  res.render('login', {
    user: users[req.session.user_id],
  });
});

//update an existing URL data with a new long URL
app.put("/urls/:shortURL", (req, res) => { 
  const shortURL = req.params.shortURL;
  //send error msg if user is not logged in
  if (!req.session.user_id) {
    return res.status(`401`).send('Not logged in');
  }
  //send error msg if the link does not exist in database
  if (!urlDatabase[shortURL]) {
    return res.status(`401`).send('Invalid URL');
  }
   //send error msg if the link does not belong to user
  if (req.session.user_id !== urlDatabase[shortURL]['userID']) {
    return res.status(`401`).send('Access only granted to URL creator');  
  }
  urlDatabase[shortURL]['longURL'] = req.body.urlLong;
  res.redirect(`/urls/`);
});

//create a new short & long URL pair 
app.post("/urls", (req, res) => { 
  const user_id = req.session.user_id;

  //send error msg if user is not logged in or has invalid credential
  if (!user_id || !lookUpUserById(user_id)) {
    return res.status(401).send("No access. Try logging in. ")
  }
  //generate a random string as short URL and write to database
  const urlShort = generateRandomString();
  urlDatabase[urlShort] = {};
  urlDatabase[urlShort]['longURL'] = req.body.urlLong;
  urlDatabase[urlShort]['userID'] = user_id;
  urlDatabase[urlShort]['date'] = new Date().toISOString().slice(0, 10);
  urlDatabase[urlShort]['totalVisit'] = 0;
  urlDatabase[urlShort]['log'] = [];
  res.redirect(`/urls/${urlShort}`);
});

//handles a login request
app.post('/login', (req, res) => { 
  const email = req.body.email;
  const password = req.body.password;
  if (emailDontExist(email)) {
    return res.status(401).send("Email doesn't exist");
  } 
  if (!passwordCorrect(email, password)) {
    return res.status(401).send('Email or password incorrect');
  }
  const user = getUserByEmail(email, users);
  console.log(user['id']);
  req.session.user_id = user['id'];
  res.redirect('urls');
})

//handles a log out request
app.post('/logout', (req, res) => {
  const user_id = req.body.user_id;
  if  (req.session.user_id === user_id){
    req.session = null
    }
  res.redirect('urls');
})

//handles a registration request
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //send an error msg if email/pw is empty
  if (email === "" || password == "") return res.status(404).send('Email or password invalid');
  //send an error msg if email already exists in database
  if (!emailDontExist(email)) return res.status(400).send('Email already registered');
  bcrypt.genSalt(10)
  .then((salt) => {
    return bcrypt.hash(password, salt)
  })
  .then((hash) => {
    const id = generateRandomString();
    req.session.user_id = id;
    users[id] = {};
    users[id]['id'] = id;
    users[id]['email'] = email;
    users[id]['password'] = hash;
    res.redirect('urls');
  })
})

  //deletes a short URL from database
app.delete("/urls/:shortURL/", (req, res) => { 
  
  //send an error message if not logged in
  if (!req.session.user_id) {
    return res.status(`401`).send('Not logged in');
  }
  //send an error message if link doesn't exist in db
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(`401`).send('Invalid URL');
  }
  //send an error message if user is not the creator of the link
  if (req.session.user_id !== urlDatabase[req.params.shortURL]['userID']) {
    return res.status(`401`).send('Access only granted to URL creator');  
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


/**
 * Generate a random alphanumeric string that includes number, lower
 * and upper case characters.
 */
const generateRandomString = () => {
  const result = [];
  while (result.length < 6) {
    let rand;
    if(Math.random() < 10 / (10 + 26 * 2)) { 
      rand = Math.floor(Math.random() * 10);
    } else {
      rand = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
      if(Math.random() > 0.5) rand = rand.toLowerCase();
    }
    result.push(rand);
  }
  return result.join('');
}

/**
 * Check if an email exist in the database
 *
 * @param {string} email - The user's email address
 * @return {boolean}
 */
const emailDontExist = (email) => {
  for (const userKey in users) {
    if (users[userKey]['email'] == email) return false;
  }
  return true;
}

/**
 * Check if a passwrod is correct using bcrypt
 *
 * @param {string} email 
 * @param {string} password - password as inputted
 * @return {boolean} 
 */
const passwordCorrect = (email, password) => {
  for (const userKey in users) {
    if (users[userKey]['email'] == email && bcrypt.compareSync(password, users[userKey]['password'])) {
      return true;
    }
  }
  return false;
}

/**
 * Look up user by ID
 *
 * @param {string} id 
 */
const lookUpUserById = (id) => {
  if (users[id] !== undefined) {
      return users[id];
  }
  return false;
}

/**
 * Returns an object that contains the user's url data
 *
 * @param {string} userID 
 */
const urlsForUser = (userID) => {
  const result = {}
  for (const shortURLKey in urlDatabase) {
    if (urlDatabase[shortURLKey]['userID'] === userID) {
      result[shortURLKey] = {};
      result[shortURLKey]['longURL'] = urlDatabase[shortURLKey]['longURL'];
      result[shortURLKey]['userID'] = urlDatabase[shortURLKey]['userID'];
      result[shortURLKey]['date'] = urlDatabase[shortURLKey]['date'];
      result[shortURLKey]['totalVisit'] = urlDatabase[shortURLKey]['totalVisit'];
      result[shortURLKey]['log'] = urlDatabase[shortURLKey]['log'];
    }
  }
  return result;  
}