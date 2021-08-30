const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


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


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = () => {
  const result = [];
  while (result.length < 6) {
    const letter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
    if(Math.random() > 0.5) letter = letter.toLowerCase();
    result.push(letter);
  }
  return result.join('');
}