const express = require("express");
const app = express();
const morgan = require('morgan');
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser())
app.use(morgan('dev'));

const urlDatabase = {
  "b2xVn2": {longURL:"http://www.lighthouselabs.ca",
             userID: "user2RandomID"},
  "9sm5xK": {longURL:"http://www.oku.club",
             userID: "uQXq7o"},
  "8as3xW": {longURL:"http://www.plannedparenthood.org",
             userID: "uQXq7o"},
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "uQXq7o": {
    id: "uQXq7o", 
    email: "123@321", 
    password: "123"
  }
}
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) res.status(404).send('URL not found');
  res.redirect(`${urlDatabase[req.params.shortURL]['longURL']}`);
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  const userURLDatabase = urlsForUser(user_id);
  res.render('urls_index', {
    userURLDatabase,
    user: users[user_id],
  });
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies['user_id'];
  if (user_id === undefined || !lookUpUserById(user_id)) {
    return res.redirect('/login');
  }
  res.render('urls_new', {
    user: users[req.cookies["user_id"]],
  });
});

app.get("/urls/:shortURL", (req, res) => {
   const templateVars = {
    urlShort: req.params.shortURL,
    urlLong: urlDatabase[req.params.shortURL]['longURL'],
    user: users[req.cookies["user_id"]],
   }
  res.render('urls_show', templateVars);
});

app.get("/register", (req, res) => {
  const user_id = req.cookies['user_id'];
  if (user_id !== undefined && lookUpUserById(user_id)) {
    return res.redirect('/urls');
  }
    res.render('register', {
    user: users[req.cookies["user_id"]],
  });
});

app.get("/login", (req, res) => {
  const user_id = req.cookies['user_id'];
  if (user_id !== undefined && lookUpUserById(user_id)) {
    return res.redirect('/urls');
  }
  res.render('login', {
    user: users[req.cookies["user_id"]],
  });
});

app.post("/urls/:shortURL/delete", (req, res) => { //to be updated
  if (req.cookies['user_id'] !== urlDatabase[req.params.shortURL]['userID']) return res.status(`401`).send('No access');
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => { //to be updated
  if (req.cookies['user_id'] !== urlDatabase[req.params.id]['userID']) return res.status(`401`).send('No access');  urlDatabase[req.params.id]['longURL'] = req.body.urlLong;
  urlDatabase[req.params.id]['userID'] = req.cookies['user_id'];
  res.redirect(`/urls/`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.post("/urls", (req, res) => {
  const user_id = req.cookies['user_id'];
  if (user_id === undefined && !lookUpUserById(user_id)) {
    return res.redirect('/login');
  }
  const urlShort = generateRandomString();
  urlDatabase[urlShort]['longURL'] = req.body.urlLong;
  res.redirect(`/urls/${urlShort}`);
});

app.post('/login', (req, res) => { 
  const email = req.body.email;
  const password = req.body.password;
  if (emailDontExist(email)) {
    return res.status(403).send("");
  } else if (!passwordCorrect(email, password)) {
    return res.sendStatus(403);
  }
  const user_id = lookUpIdByEmail(email);
  res.cookie("user_id", user_id);
  res.redirect('urls');
})

app.post('/logout', (req, res) => {
  const user_id = req.body.user_id;
  console.log(user_id);
  for (let key in req.cookies) {
    if (key === 'user_id' && req.cookies[key] === user_id){
      res.clearCookie(key);
    }
  }
  res.redirect('urls');
})

app.post('/register', (req, res) => {
  console.log(users);
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password == "") return res.status(404).send('Email or password invalid');
  if (!emailDontExist(email)) return res.status(400).send('Email already registered');
  const id = generateRandomString();
  users[id] = {};
  users[id]['id'] = id;
  users[id]['email'] = email;
  users[id]['password'] = password;
  res.cookie("user_id", id);
  console.log(users);
  res.redirect('urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = () => {
  const result = [];
  while (result.length < 6) {
    let rand;
    if(Math.random() < 10 / (10 + 26 * 2)) { //assign number probability in addition to alphabet
      rand = Math.floor(Math.random() * 10);
    } else {
      rand = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
      if(Math.random() > 0.5) rand = rand.toLowerCase();
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
    if (users[userKey]['email'] == email && users[userKey]['password'] == password) {
      return true;
    }
  }
  return false;
}

const lookUpIdByEmail = (email) => {
  for (const userKey in users) {
    if (users[userKey]['email'] == email) {
      return users[userKey]['id'];
    }
  }
  return false;
}

const lookUpUserById = (id) => {
  if (users[userKey] !== undefined) {
      return users[userKey];
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
    }
  }
  return result;  
}