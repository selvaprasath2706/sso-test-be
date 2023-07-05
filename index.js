const express = require("express");
const passport = require("passport");
const SamlStrategy = require("passport-saml").Strategy;
require("dotenv").config();

const app = express();


const samlConfig = {
  entryPoint: process.env.entryPoint,
  issuer: process.env.issuer,
  callbackUrl: process.env.callbackUrl,
};


// Configure passport with the SAML strategy
passport.use(
  new SamlStrategy(samlConfig, (profile, done) => {
    // You can access the user profile data returned by the SAML response
    console.log(profile);
    return done(null, profile);
  })
);

// Initialize passport
app.use(passport.initialize());

// Create the login route
app.get("/login", passport.authenticate("saml"));

// Create the SAML callback route
app.post(
  "/auth/callback",
  passport.authenticate("saml", { failureRedirect: "/login/error" }),
  (req, res) => {
    // Authentication succeeded, redirect to a success page or perform further actions
    res.redirect("/login/success");
  }
);

// Create a protected route
app.get("/protected", ensureAuthenticated, (req, res) => {
  res.send("You have accessed the protected route!");
});

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
