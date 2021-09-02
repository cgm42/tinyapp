const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
const morgan = require('morgan');
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {getUserByEmail} = require('./helper')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["meowmIsHere"],
}))
app.use(morgan('dev'));

const urlDatabase = {
  "b2xVn2": {longURL:"http://www.cbc.ca",
             userID: "user2RandomID",
             date: "2021-09-01",
             totalVisit: 10,
             uniqueVisitors: [],
             log: []},
  "9sm5xK": {longURL:"http://www.oku.club",
             userID: "lmFOgr",
             date: "2021-08-31",
             totalVisit: 1,
             uniqueVisitors: [],
             log: []},
  "8as3xW": {longURL:"http://www.npr.org",
            userID: "lmFOgr",
            date: "2021-09-02",
            totalVisit: 5,
            uniqueVisitors: [], 
            log: []},
};

const users = {
  "lmFOgr": {
    id: "lmFOgr", 
    email: "qwe@qwe", 
    password: "$2b$10$hMCnZwaMCxEGHi9bRQVKZOeUjsI74DNt3ah455Wao9c9mCy0osUjC"
  },
 
}

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) res.status(404).send('URL not found');
  //TODO: 3. add timestamp and visitor_id
  urlDatabase[req.params.shortURL]['totalVisit'] += 1;
  if (!req.session.user_id) {
    req.session.user_id = generateRandomString();
  }
  if (!urlDatabase[req.params.shortURL]['uniqueVisitors'].includes(req.session.user_id)) {
    urlDatabase[req.params.shortURL]['uniqueVisitors'].push(req.session.user_id);//TODO: filter
  }
  const tempVar = {
    timestamp: new Date(),
    visitor_id: req.session.user_id,
  }
  urlDatabase[req.params.shortURL]['log'].push(tempVar);
  console.log(urlDatabase[req.params.shortURL]);
  res.redirect(`${urlDatabase[req.params.shortURL]['longURL']}`);
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const userURLDatabase = urlsForUser(user_id);
  res.render('urls_index', {
    userURLDatabase,
    user: users[user_id],
  });
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id === undefined || !lookUpUserById(user_id)) {
    return res.redirect('/login');
  }
  res.render('urls_new', {
    user: users[req.session.user_id],
  });
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === undefined) {
    return res.status(`401`).send('<html><h1>Not logged in<h1><html>');//TODO:
  }
  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.status(`401`).send('Invalid URL');
  }
  if (req.session.user_id !== urlDatabase[req.params.shortURL]['userID']) {
    return res.status(`401`).send('Access only granted to URL creator');  
  }
   const templateVars = {
    urlShort: req.params.shortURL,
    urlObj: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id],
   }
  res.render('urls_show', templateVars);
});

app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id !== undefined && lookUpUserById(user_id)) {
    return res.redirect('/urls');
  }
    res.render('register', {
    user: users[req.session.user_id],
  });
});

app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id !== undefined && lookUpUserById(user_id)) {
    return res.redirect('/urls');
  }
  res.render('login', {
    user: users[req.session.user_id],
  });
});

app.post("/urls/:shortURL/delete", (req, res) => { 
  
  if (!req.session.user_id || req.session.user_id === null) {
    return res.status(`401`).send('Not logged in');
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(`401`).send('Invalid URL');
  }
  if (req.session.user_id !== urlDatabase[req.params.shortURL]['userID']) {
    return res.status(`401`).send('Access only granted to URL creator');  
  }
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => { 
  console.log('req.session.user_id :>> ', req.session.user_id);
  if (!req.session.user_id) {
    return res.status(`401`).send('Not logged in');
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(`401`).send('Invalid URL');
  }
  if (req.session.user_id !== urlDatabase[req.params.shortURL]['userID']) {
    return res.status(`401`).send('Access only granted to URL creator');  
  }
  urlDatabase[req.params.shortURL] = {};
  urlDatabase[req.params.shortURL]['longURL'] = req.body.urlLong;
  urlDatabase[req.params.shortURL]['userID'] = req.session.user_id;
  urlDatabase[req.params.shortURL]['date'] = new Date();
  urlDatabase[req.params.shortURL]['totalVisit'] = 0;
  urlDatabase[req.params.shortURL]['uniqueVisitors'] = [];
  res.redirect(`/urls/`);
});

app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id || !lookUpUserById(user_id)) {
    return res.status(401).send("No access. Try logging in. ")
  }
  const urlShort = generateRandomString();
  urlDatabase[urlShort] = {};
  urlDatabase[urlShort]['longURL'] = req.body.urlLong;
  urlDatabase[urlShort]['userID'] = user_id;
  urlDatabase[urlShort]['date'] = new Date().toISOString().slice(0, 10);
  console.log(urlDatabase[urlShort]);
  res.redirect(`/urls/${urlShort}`);
});

app.post('/login', (req, res) => { 
  const email = req.body.email;
  const password = req.body.password;
  if (emailDontExist(email)) {
    return res.status(401).send("Email doesn't exist");//TODO:
  } 
  if (!passwordCorrect(email, password)) {
    return res.status(401).send('Email or password incorrect');//TODO:
  }
  const user = getUserByEmail(email, users);
  console.log(user['id']);
  req.session.user_id = user['id'];
  res.redirect('urls');//TODO:
})

app.post('/logout', (req, res) => {
  const user_id = req.body.user_id;
  if  (req.session.user_id === user_id){
    req.session = null
    }
  res.redirect('urls');
})

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password == "") return res.status(404).send('Email or password invalid');
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = () => {
  const result = [];
  while (result.length < 6) {
    let rand;
    if(Math.random() < 10 / (10 + 26 * 2)) { //play alphanumeric lottery
      rand = Math.floor(Math.random() * 10);//it's a number
    } else {
      rand = String.fromCharCode(Math.floor(Math.random() * 26) + 65);//it's a letter
      if(Math.random() > 0.5) rand = rand.toLowerCase();//it's a lowercase letter
    }
    result.push(rand);
  }
  return result.join('');
}

const emailDontExist = (email) => {
  for (const userKey in users) {
    if (users[userKey]['email'] == email) return false;
  }
  return true;
}

const passwordCorrect = (email, password) => {
  for (const userKey in users) {
    if (users[userKey]['email'] == email && bcrypt.compareSync(password, users[userKey]['password'])) {
      return true;
    }
  }
  return false;
}


const lookUpUserById = (id) => {
  if (users[id] !== undefined) {
      return users[id];
  }
  return false;
}

const urlsForUser = (userID) => {
  const result = {}
  for (const shortURLKey in urlDatabase) {
    if (urlDatabase[shortURLKey]['userID'] === userID) {
      result[shortURLKey] = {};
      result[shortURLKey]['longURL'] = urlDatabase[shortURLKey]['longURL'];
      result[shortURLKey]['userID'] = urlDatabase[shortURLKey]['userID'];
      result[shortURLKey]['date'] = urlDatabase[shortURLKey]['date'];
      result[shortURLKey]['totalVisit'] = urlDatabase[shortURLKey]['totalVisit'];
      result[shortURLKey]['uniqueVisitors'] = urlDatabase[shortURLKey]['uniqueVisitors'];
    }
  }
  return result;  
}