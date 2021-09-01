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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
    email: "xsdf2@example.com", 
    password: "sdfsdf"
  }
}
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/u/:shortURL", (req, res) => {
  res.redirect(`${urlDatabase[req.params.shortURL]}`);
});

app.get("/urls", (req, res) => {
  res.render('urls_index', {
    urlDatabase,
    user: users[req.cookies["user_id"]],
  });
});

app.get("/urls/new", (req, res) => {
  res.render('urls_new', {
    user: users[req.cookies["user_id"]],
  });
});

app.get("/urls/:shortURL", (req, res) => {
   const templateVars = {
    urlShort: req.params.shortURL,
    urlLong: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]],
   }
  res.render('urls_show', templateVars);
});

app.get("/register", (req, res) => {
  res.render('register', {
    user: users[req.cookies["user_id"]],
  });
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => { 
  urlDatabase[req.params.id] = req.body.urlLong;
  res.redirect(`/urls/`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const urlShort = generateRandomString();
  urlDatabase[urlShort] = req.body.urlLong;
  res.redirect(`/urls/${urlShort}`);
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie("user_id", username);
  res.redirect('urls');
})

app.post('/logout', (req, res) => {
  const username = req.body.username;
  res.clearCookie("user_id");
  res.redirect('urls');
})

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
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