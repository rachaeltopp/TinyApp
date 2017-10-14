const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['userID']
}));

//function to create random ID
function random () {
  return Math.random().toString(36).slice(2,8);
};

//some static data to test with
let urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "" },
  "9sm5xK": {longURL: "http://www.google.com", userID: ""}
};

//some static data to test with
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

//get request to render the urls_index page
app.get('/urls', (req, res) => {
  var userID = req.session.userID; 
  var user = users[userID];
  let newDatabase = {};
  // conditional to pick only urls that were created by this user
  for (var key in urlDatabase) {
    if (urlDatabase[key].userID === userID) {
      newDatabase[key] = urlDatabase[key];
    }
  }
  let templateVars = { urls: newDatabase, user: user };
  res.render("urls_index", templateVars);
});

//get request to render the urls_new page if logged in
app.get("/urls/new", (req, res) => {
  var userID = req.session.userID;
  var user = users[userID];
  if (req.session.userID) {
    res.render("urls_new", {user: user});
    return;
  }
  //if not logged in redirect to the login page
  res.redirect("/login");
});

//get request to render register page
app.get("/register", (req, res) => {
  var userID = req.session.userID;
  var user = users[userID];
  res.render("register", {user: user});
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let hashedPassword = require("bcrypt").hashSync(password, 10);
  const userID = random();
  //if the email or password is empty, 400 code
  if(email == "" || password == "") {
    res.status(400).send("Please enter a valid email and password.");
    return;
  }
  //if email is already in users database, 400 code
  for (key in users) {
    if (email === users[key].email) {
      res.status(400).send("This email is already registered.");
      return;
    }
  } 
  //store email, hashed password, and userID in users database  
  users[userID] = {id: userID, email: req.body.email, password: hashedPassword};
  req.session.userID = users[userID].id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
})

app.post("/urls", (req, res) => {
  const shortURL = random();
  //update urlsDatabase with shortURL and associated longURL and userID who created it
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.userID};
  res.redirect("/urls");        
});

//redirect to longURL using the shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//render urls_show page to edit URLS only if logged in and userID matches the URL
app.get("/urls/:id", (req, res) => {
  var userID = req.session.userID;
  var user = users[userID];
  if (userID === urlDatabase[req.params.id].userID) {
    let templateVars = {shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: user };
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("Please verify that you are logged in and that you created this shortURL.");
  }
});

//if the user matched the user who made the shortURL, update the url in the database
app.post("/urls/:id", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = {longURL: req.body.longURL, userID: req.session.userID};
    res.redirect("/urls");
    return;
  }
  res.send("You may not edit a URL that you have not created."); 
})

//if the user matches the user who created the shortURL, delete that shortURL
app.post("/urls/:key/delete", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.key].userID) {
    delete urlDatabase[req.params.key];
    res.redirect("/urls");
    return;
  }
  res.send("You may not delete a URL that you have not created.");
})

//check if email is in users database and check if passwords match
app.post("/login", (req, res) => {
  for (var key in users) {
    if (req.body.email === users[key].email) {
      if (require("bcrypt").compareSync(req.body.password, users[key].password)) {
        req.session.userID = users[key].id;
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

//reset cookies on logout
app.post("/logout", (req, res) => {
  req.session = null; 
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



