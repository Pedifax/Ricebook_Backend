const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "283104003824-bp9sg2i01eaarkcnf2ijit8dd4i1kvru.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    function (req, accessToken, refreshToken, profile, callback) {
      return callback(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
