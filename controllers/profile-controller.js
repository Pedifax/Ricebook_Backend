const { validationResult, check } = require("express-validator");
const mongoose = require("mongoose");
const { cloudinary } = require("../util/cloudinary");
const fs = require("fs");

const multerUpload = require("../middleware/multer-upload");
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

const getProfileObject = async (req, res, next) => {
  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
  }
  userProfile = userProfile.toObject({ getters: true });
  return res.json({
    status: "success!",
    function: "getProfileObject",
    profileObject: userProfile,
  });
};

const getHeadline = async (req, res, next) => {
  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
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
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
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
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
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
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
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
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
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
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
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
      // new HttpError("Please input a valid email address. (updateEmail)")
      new HttpError("Error")
    );
  }

  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
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
    // return next(new HttpError("Please input a valid zipcode. (updateZipcode)"));
    return next(new HttpError("Error"));
  }

  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
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
      // new HttpError("Please input a valid avatar url. (updateZipcode)")
      new HttpError("Error")
    );
  }

  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
  }
  console.log(req.file);
  // upload to cloudinary
  try {
    // const imageFile = req.file.path; // relative path on server
    // const imageFile = req.file.buffer; // relative path on server
    const imageFile = req.fileurl; // relative path on server
    const uploadResponse = await cloudinary.uploader.upload(imageFile);
    // console.log(uploadResponse);
    userProfile.avatar = uploadResponse.url;

    // fs.unlink the image from this server
    // fs.unlink(imageFile, (err) => {
    //   if (err) {
    //     console.log("error occured when unlinking an image. (createArticle)");
    //   }
    // });
  } catch (err) {
    console.log(err);
    return next(
      new HttpError(
        "Cannot upload image. (profile-controller > updateAvatar)",
        500
      )
    );
  }

  try {
    await userProfile.save();
  } catch (err) {
    return next(
      new HttpError(
        err + ". Something went wrong. (updateAvatar > save())",
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

const updateProfile = async (req, res, next) => {
  let userProfile = await getUserProfile(req, res, next);
  if (!userProfile) {
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
  }

  const { email, phone, zip } = req.body;

  if (email && email.length > 0) {
    userProfile.email = email;
  }
  if (phone && phone.length > 0) {
    userProfile.phone = phone;
  }
  if (zip && zip.length > 0) {
    userProfile.zip = zip;
  }

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
    function: "updateProfile",
    userProfile,
  });
};

module.exports = (app) => {
  app.get("/profile", getProfileObject);
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
  app.put("/avatar", multerUpload("image"), updateAvatar);
  app.put("/profile", updateProfile);
};
