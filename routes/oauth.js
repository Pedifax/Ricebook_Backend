const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// setup
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "283104003824-bp9sg2i01eaarkcnf2ijit8dd4i1kvru.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "https://final-app.herokuapp.com/oauth/google/callback",
      // callbackURL: "/oauth/google/callback",
    },
    function (req, accessToken, refreshToken, profile, callback) {
      return callback(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
// setup

// Routers:

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/oauth_success",
    failureRedirect: "/",
  })
);

module.exports = router;
