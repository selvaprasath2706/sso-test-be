const express = require("express");
const passport = require("passport");
const SamlStrategy = require("passport-saml").Strategy;
var bodyParser = require("body-parser");
require("dotenv").config();
const session = require("express-session");

const app = express();

app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.secret, // Replace with your own secret key
    resave: false,
    saveUninitialized: false,
  })
);

const samlConfig = {
  entryPoint: process.env.entryPoint,
  issuer: process.env.issuer,
  callbackUrl: process.env.callbackUrl,
  cert: process.env.cert,
};

passport.serializeUser((user, done) => {
  // Serialize user into session
  done(null, user.id);
});

// passport.deserializeUser((id, done) => {
//   // Fetch user from database or other data source based on the user ID
//   const user = getUserById(id);
//   done(null, user);
// });
// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Configure passport with the SAML strategy
passport.use(
  new SamlStrategy(samlConfig, (profile, done) => {
    // You can access the user profile data returned by the SAML response
    console.log("profile",profile);
    const user = {
      id: profile.nameID,
      displayName:
        profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
      email:
        profile[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ],
      // ... other user attributes
    };
    return done(null, user);
  })
);



// Create the login route
app.get("/login", passport.authenticate("saml"));

// Create the SAML callback route
app.post(
  "/auth/callback",
  passport.authenticate("saml", { failureRedirect: "/login/error" }),
  (req, res) => {
    console.log("success callback")
    // Authentication succeeded, redirect to a success page or perform further actions
    res.send("Welcome you have been logged in")
    // res.redirect("/login/success");
  }
);

app.get("/login/error",  (req, res) => {
  res.send("You have reached the error route!");
});


// Create a protected route
app.get("/protected", ensureAuthenticated, (req, res) => {
  res.send("You have accessed the protected route!");
});

app.get("/sample", (req, res) => {
  res.send("You have reached sample route");
});

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Start the server
app.listen(3001, () => {
  console.log("Server is running on port 3000");
});
