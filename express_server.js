const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

function random () {
  return Math.random().toString(36).slice(2,8);
};

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let users = {
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

app.get('/urls', (req, res) => {
  var userId = req.cookies["userID"];
  var user = users[userId];
  let templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  var userId = req.cookies["userID"];
  var user = users[userId];
  res.render("urls_new", {user: user});
});

app.get("/register", (req, res) => {
  var userId = req.cookies["userID"];
  var user = users[userId];
  res.render("register", {user: user});
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = random();

  if(email == "" || password == "") {
    res.status(400).send("Please enter a valid email and password.");
    return;
  }

  for (key in users) {
    if (email === users[key].email) {
      res.status(400).send("This email is already registered.");
      return;
    }
  }   
  users[userID] = {id: userID, email: req.body.email, password: req.body.password};
  res.cookie("userID", userID);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
})

app.post("/urls", (req, res) => {
  const shortURL = random();
  urlDatabase[shortURL] = req.body.longURL; 
  res.redirect("/urls");        
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(req.params.shortURL, longURL);
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  var userId = req.cookies["userID"];
  var user = users[userId];
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], user: user };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id]=req.body.longURL;
  res.redirect("/urls");
})

app.post("/urls/:key/delete", (req, res) => {
  delete urlDatabase[req.params.key];
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  for (var key in users) {
    if (req.body.email === users[key].email) {
      if (req.body.password === users[key].password) {
        res.cookie("userID", users[key].id);
        res.redirect("/urls");
        return;
      } else {
        res.status(403).send("Sorry, your password did not match our records");
        return;
      }
    } 
  }
  res.status(403).send("Sorry, the email you have entered has not yet been registered.");
});

app.post("/logout", (req, res) => {
  res.clearCookie('userID')
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



