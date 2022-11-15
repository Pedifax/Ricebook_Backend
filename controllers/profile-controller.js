const { validationResult, check } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../util/http-error");
const User = require("../models/user");
const Profile = require("../models/profile");

const getUserProfile = async (req, res, next) => {
  let userProfile, username;
  const userParam = req.params.user;
  userParam === undefined
    ? (username = req.userData.username)
    : (username = req.params.user);

  try {
    userProfile = await Profile.findOne({ username });
  } catch (err) {
    const error = new HttpError(
      err + ". Connection error. (getUserProfile > profile.findOne())",
      500
    );
    return next(error);
  }
  return userProfile;
};

const getHeadline = async (req, res, next) => {
  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }

  userProfile = userProfile.toObject({ getters: true });

  res.json({
    status: "success!",
    function: "getHeadline",
    username: userProfile.username,
    headline: userProfile.headline,
  });
};

const getEmail = async (req, res, next) => {
  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }
  userProfile = userProfile.toObject({ getters: true });

  res.json({
    status: "success!",
    function: "getEmail",
    username: userProfile.username,
    email: userProfile.email,
  });
};

const getZip = async (req, res, next) => {
  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }
  userProfile = userProfile.toObject({ getters: true });

  res.json({
    status: "success!",
    function: "getZip",
    username: userProfile.username,
    zipcode: userProfile.zip,
  });
};

const getAvatar = async (req, res, next) => {
  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }
  userProfile = userProfile.toObject({ getters: true });

  res.json({
    status: "success!",
    function: "getAvatar",
    username: userProfile.username,
    avatar: userProfile.avatar,
  });
};

const getDob = async (req, res, next) => {
  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }
  userProfile = userProfile.toObject({ getters: true });
  let millisecond = new Date(userProfile.dob);
  millisecond = millisecond.getTime();

  res.json({
    status: "success!",
    function: "getDob",
    username: userProfile.username,
    dob: millisecond,
  });
};

const updateHeadline = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        "The headline can't be empty. (updateHeadline > validationResult)"
      )
    );
  }

  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }

  const { headline } = req.body;
  userProfile.headline = headline;

  try {
    await userProfile.save();
  } catch (err) {
    return next(
      new HttpError(
        err +
          ". Something went wrong, could not update headline. (updateHeadline > save())",
        500
      )
    );
  }

  res.json({
    status: "success!",
    function: "updateHeadline",
    username: userProfile.username,
    headline: userProfile.headline,
  });
};

const updateEmail = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Please input a valid email address. (updateEmail)")
    );
  }

  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }

  const { email } = req.body;
  userProfile.email = email;

  try {
    await userProfile.save();
  } catch (err) {
    return next(
      new HttpError(
        err +
          ". Something went wrong, could not update headline. (updateEmail > save())",
        500
      )
    );
  }

  res.json({
    status: "success!",
    function: "updateHeadline",
    username: userProfile.username,
    email: userProfile.email,
  });
};

const updateZip = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Please input a valid zipcode. (updateZipcode)"));
  }

  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }

  const { zipcode } = req.body;
  userProfile.zip = zipcode;

  try {
    await userProfile.save();
  } catch (err) {
    return next(
      new HttpError(
        err +
          ". Something went wrong, could not update headline. (updateEmail > save())",
        500
      )
    );
  }

  res.json({
    status: "success!",
    function: "updateHeadline",
    username: userProfile.username,
    zipcode: userProfile.zip,
  });
};

const updateAvatar = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Please input a valid avatar url. (updateZipcode)")
    );
  }

  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    return next(new HttpError("Could not find this user."));
  }

  const { avatar } = req.body;
  userProfile.avatar = avatar;

  try {
    await userProfile.save();
  } catch (err) {
    return next(
      new HttpError(
        err +
          ". Something went wrong, could not update headline. (updateEmail > save())",
        500
      )
    );
  }

  res.json({
    status: "success!",
    function: "updateHeadline",
    username: userProfile.username,
    avatar: userProfile.avatar,
  });
};

module.exports = (app) => {
  app.get("/headline/:user?", getHeadline);
  app.get("/email/:user?", getEmail);
  app.get("/zipcode/:user?", getZip);
  app.get("/avatar/:user?", getAvatar);
  app.get("/dob/:user?", getDob);
  app.put("/headline", [check("headline").not().isEmpty()], updateHeadline);
  app.put(
    "/email",
    [check("email").not().isEmpty(), check("email").isEmail()],
    updateEmail
  );
  app.put(
    "/zipcode",
    [
      check("zipcode").not().isEmpty(),
      check("zipcode").isLength({ min: 5, max: 5 }),
      check("zipcode").isNumeric(),
    ],
    updateZip
  );
  app.put("/avatar", [check("avatar").trim().not().isEmpty()], updateAvatar);
};
