const express = require("express");
const app = express();
const morgan = require('morgan');
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(morgan('dev'));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  res.render('urls_index', {
    urlDatabase,
  });
});

app.get("/urls/new", (req, res) => {
  res.render('urls_new');
});

app.get("/urls/:shortURL", (req, res) => {
   const templateVars = {
    urlShort: req.params.shortURL,
    urlLong: urlDatabase[req.params.shortURL]
   }
  res.render('urls_show', templateVars);
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



app.get("/u/:shortURL", (req, res) => {
  res.redirect(`${urlDatabase[req.params.shortURL]}`);
});


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