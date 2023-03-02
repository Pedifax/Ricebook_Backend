const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const HttpError = require("../util/http-error");
const User = require("../models/user");
const Profile = require("../models/profile");

const generateSaltAndPassword = async (req, res, next, password) => {
  let generatedSalt, hashedPassword;
  try {
    generatedSalt = await bcrypt.genSalt();
    hashedPassword = await bcrypt.hash(password, generatedSalt);
  } catch (err) {
    const error = new HttpError(
      err + ". Error. (generateSaltAndPassword())",
      500
    );
    return next(error);
  }
  return { generatedSalt, hashedPassword };
};

const processOauthSuccess = async (req, res, next) => {
  const idEnd = req.user.id.slice(0, 3);
  const username = `${req.user.displayName} - ${idEnd}`;
  const email = req.user.emails[0].value;
  const avatar = req.user.photos[0].value;

  let targetUser;
  try {
    targetUser = await User.findOne({ username, googleAuth: true });
  } catch (err) {
    return next(
      new HttpError(
        // "Could not check targetUser. (oauth)",
        "Error",
        500
      )
    );
  }

  if (!targetUser) {
    const { generatedSalt, hashedPassword } = await generateSaltAndPassword(
      req,
      res,
      next,
      uuid()
    );
    let dob = new Date();
    dob = dob.toLocaleDateString();

    const createdUser = new User({
      username,
      password: hashedPassword,
      salt: generatedSalt,
      articles: [],
      followedUsers: [],
      googleAuth: true,
    });

    const createdProfile = new Profile({
      username,
      displayName: req.user.displayName,
      headline: `Share your status?`,
      email,
      phone: "000-000-0000",
      zip: "00000",
      avatar,
      dob,
    });

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdUser.save({ session: sess });
      await createdProfile.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      return next(
        new HttpError(
          err +
            // ". Something went wrong, could not oauth. (OAuth register: can't save())",
            "Error.",
          500
        )
      );
    }
  }

  let sessionId;
  try {
    sessionId = jwt.sign(
      { userId: null, username: username },
      process.env.JWT_KEY,
      { expiresIn: "12h" }
    );
  } catch (err) {
    const error = new HttpError(
      err + ". Signing up failed. (OAuth-controller > jwt)",
      500
    );
    return next(error);
  }

  global.sessionUser[username] = sessionId;

  return res
    .cookie("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    })
    .redirect(process.env.FRONTEND_URL);
};

module.exports = (app) => {
  app.get("/oauth_success", processOauthSuccess);
};
