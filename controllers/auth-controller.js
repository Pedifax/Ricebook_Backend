const { validationResult, check } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { cloudinary } = require("../util/cloudinary");
const fs = require("fs");

const multerUpload = require("../middleware/multer-upload");
const HttpError = require("../util/http-error");
const User = require("../models/user");
const Profile = require("../models/profile");
const article = require("../models/article");

global.sessionUser = {};

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

const login = async (req, res, next) => {
  const { username, password } = req.body;

  let targetUser;
  try {
    targetUser = await User.findOne({ username: username });
  } catch (err) {
    // return next(new HttpError("Could not check targetUser. (login)", 500));
    return next(new HttpError("Error"));
  }

  if (!targetUser) {
    const error = new HttpError(
      "Invalid credentials. Could not log in. (No matched user. login)",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, targetUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log in. (calculate isValidPassword. login)",
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials. Could not log in. (password wrong. login)",
      403
    );
    return next(error);
  }

  let sessionId;
  try {
    sessionId = jwt.sign(
      { userId: targetUser.id, username: targetUser.username },
      process.env.JWT_KEY,
      { expiresIn: "12h" } // this sessionId will last for 12 hour, recognized by jwt
    );
  } catch (err) {
    const error = new HttpError(
      err + ". Signing up failed. (login > jwt)",
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
    .json({
      status: "success!",
      result: "success",
      username,
      function: "login",
      loggedInUser: {
        username: targetUser.username,
      },
    });
};

const register = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      // new HttpError("Invalid data . Please check you inputs. (register)")
      new HttpError("Invalid data.")
    );
  }

  let avatar;
  const { username, password, email, phone, zip, dob } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ username: username });
  } catch (err) {
    // return next(new HttpError("Could not check existingUser. (register)", 500));
    return next(new HttpError("Error", 500));
  }
  if (existingUser) {
    // const error = new HttpError("User exists already. (register)", 422);
    // return next(error);
    return next(new HttpError("Error"));
  }

  try {
    // const imageFile = req.file.path; // relative path on server
    const imageFile = req.fileurl; // relative path on server
    const uploadResponse = await cloudinary.uploader.upload(imageFile);
    // console.log(uploadResponse);
    avatar = uploadResponse.url;

    // fs.unlink the image from this server
    // fs.unlink(imageFile, (err) => {
    //   if (err) {
    //     console.log("error occured when unlinking an image. (register)");
    //   }
    // });
  } catch (err) {
    console.log(err);
    // return next(new HttpError("Cannot upload image. (register)", 500));
    return next(new HttpError("Error"));
  }

  let { generatedSalt, hashedPassword } = await generateSaltAndPassword(
    req,
    res,
    next,
    password
  );

  let createdUser = new User({
    username,
    password: hashedPassword,
    salt: generatedSalt,
    articles: [],
    followedUsers: [],
  });

  const createdProfile = new Profile({
    username,
    displayName: `--- default DISPLAY NAME for ${username} ---`,
    headline: `Share your status?`,
    email,
    phone,
    zip,
    avatar,
  });

  if (dob) {
    createdProfile.dob = dob;
  }

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
          ". Something went wrong, could not sign up. (register: can't do save())",
        500
      )
    );
  }

  let sessionId;
  createdUser = createdUser.toObject({ getters: true });
  try {
    sessionId = jwt.sign(
      { userId: createdUser.id, username: createdUser.username },
      process.env.JWT_KEY,
      { expiresIn: "12h" } // this sessionId will last for 12 hour, recognized by jwt
    );
  } catch (err) {
    const error = new HttpError(
      err + ". Signing up failed. (register > jwt)",
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
    .json({
      function: "reigster",
      status: "success!",
      result: "success",
      username,
      createdUser,
      createdProfile: createdProfile.toObject({ getters: true }),
    });
};

const isLoggedIn = (req, res, next) => {
  // const sessionId = req.headers.authorization;
  const sessionId = req.cookies["sessionId"];
  if (!sessionId) {
    return next(
      new HttpError(
        "Authentication failed! (no sessionId found. isLoggedIn())",
        401
      )
    );
  }

  let decodedSessionId;
  try {
    decodedSessionId = jwt.verify(sessionId, process.env.JWT_KEY);
  } catch (err) {
    return next(
      new HttpError(
        "SessionId expired. Please login again. (auth > isLoggedIn > decode sessionId)",
        401
      )
    );
  }

  if (
    decodedSessionId.userId === undefined ||
    decodedSessionId.username === undefined
  ) {
    return next(
      new HttpError(
        "Authentication failed! (nothing inside sessionId. isLoggedIn())",
        401
      )
    );
  }

  if (sessionId === global.sessionUser[decodedSessionId.username]) {
    if (req.headers.isautologin) {
      return res.json({
        message: "success",
        username: decodedSessionId.username,
      });
    }
    req.userData = {
      userId: decodedSessionId.userId,
      username: decodedSessionId.username,
    };
    next();
  } else if (!(decodedSessionId.username in global.sessionUser)) {
    // no log in record
    return next(
      new HttpError(
        "Authentication failed. Not logged in. (No record of this log in. isLoggedIn())",
        401
      )
    );
  } else {
    // the key is in global.sessionUser but value mismatch
    return next(
      new HttpError(
        "A newer log in record detected. This sessionId is expired. Please log in again instead. (isLoggedIn())",
        401
      )
    );
  }
};

const logout = (req, res, next) => {
  let userToLogOut = req.userData.username;
  req.userData = {};
  delete global.sessionUser[userToLogOut];
  res.clearCookie("sessionId");
  res.status(200).json({ message: `OK. logged out ${userToLogOut}` });
};

const updatePassword = async (req, res, next) => {
  const username = req.userData.username;
  let targetUser, oldPassword;

  try {
    targetUser = await User.findOne({ username });
  } catch (err) {
    return new HttpError(
      err + ". Can't find user. (updatePassword > targetUser)"
    );
  }

  let { generatedSalt, hashedPassword } = await generateSaltAndPassword(
    req,
    res,
    next,
    req.body.password
  );
  oldPassword = targetUser.password;
  targetUser.password = hashedPassword;
  targetUser.salt = generatedSalt;

  try {
    targetUser.save();
  } catch (err) {
    return next(
      new HttpError(err + ". Can't save usse. (updatePassword > save())")
    );
  }

  res.json({
    status: "success!",
    result: "success",
    function: "updatePassword",
    username,
    oldPassword_hashed: oldPassword,
    newPassword_hashed: hashedPassword,
  });
};

const deleteAccount = async (req, res, next) => {
  if (req.body.passcode !== "admin_passcode") {
    return next(new HttpError("Not allowed"));
  }
  const username = req.params.username;
  let targetUser, targetProfile, targetArticle;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    targetUser = await User.findOneAndDelete({ username, session: sess });
    targetProfile = await Profile.findOneAndDelete({ username, session: sess });
    targetArticle = await article.findOneAndDelete({ username, session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(
        err + ". Cannot delete the user/profile/article. (deleteAccount())"
      )
    );
  }

  return res.json({
    removedUser: username,
    message: `removed ${username} and its profile successfully.`,
    targetUser,
    targetProfile,
    targetArticle,
  });
};

module.exports = (app) => {
  app.post("/login", login);
  app.post(
    "/register",
    // multerUpload.single("image"),
    multerUpload("image"),
    [
      check("username").not().isEmpty(),
      check("email").normalizeEmail().isEmail(), // normalize = TeSt -> test
      check("password").isLength({ min: 1 }),
    ],
    register
  );
  app.delete("/delete/:username", deleteAccount);
  app.get("/auto_login", isLoggedIn);
  app.use(isLoggedIn);
  app.put("/logout", logout);
  app.put("/password", updatePassword);
};
