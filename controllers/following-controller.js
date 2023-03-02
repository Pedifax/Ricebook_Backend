const { validationResult, check } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../util/http-error");
const User = require("../models/user");

const getUserObject = async (req, res, next) => {
  let userObject, username;
  const userParam = req.params.user;
  userParam === undefined
    ? (username = req.userData.username)
    : (username = req.params.user);

  try {
    userObject = await User.findOne({ username }).populate("followedUsers");
  } catch (err) {
    const error = new HttpError(
      err + " (following-controller > getUserObject())",
      500
    );
    return next(error);
  }
  return userObject;
};

const getFollowing = async (req, res, next) => {
  let userObject = await getUserObject(req, res, next);
  if (!userObject) {
    // return next(new HttpError("Could not find this user."));
    return next(new HttpError("Error"));
  }

  let followingUsernames = userObject.followedUsers.map(
    (user) => user.username
  );
  let followingList = userObject.followedUsers.map((user) =>
    user.toObject({ getters: true })
  );

  // TODO take away the password and salt from users in followingList

  res.json({
    status: "success!",
    function: "getFollowing()",
    username: userObject.username,
    following: followingUsernames,
    followingList,
  });
};

const follow = async (req, res, next) => {
  const username = req.userData.username;
  let loggedInUser, targetUser;

  targetUser = await getUserObject(req, res, next);
  if (!targetUser) {
    return next(
      new HttpError("Could not find the user to follow. (follow > targetUser)")
      // new HttpError("Error")
    );
  }

  try {
    loggedInUser = await User.findOne({ username }).populate("followedUsers");
  } catch (err) {
    return next(
      new HttpError(
        // err + ". Could not search for the loggedInUser. (follow > loggedInUser)"
        "Error"
      )
    );
  }
  if (!loggedInUser) {
    return next(
      // new HttpError("Could not find the loggedInUser object. (follow)")
      new HttpError("Error")
    );
  }

  // check if the targetUser is already followed by loggedInUser
  let followingUsernames = loggedInUser.followedUsers.map(
    (user) => user.username
  );

  if (followingUsernames.includes(targetUser.username)) {
    return next(new HttpError(`Target user already followed.`));
  }

  try {
    loggedInUser.followedUsers.push(targetUser);
    await loggedInUser.save();
  } catch (err) {
    return next(
      new HttpError(
        err + ". Cannot push or save loggedInUser. (follow > save())"
      )
    );
  }

  followingUsernames = loggedInUser.followedUsers.map((user) => user.username);

  res.json({
    status: "success!",
    function: "follow()",
    username: loggedInUser.username,
    following: followingUsernames,
  });
};

const unfollow = async (req, res, next) => {
  const username = req.userData.username;
  let loggedInUser, targetUser;

  targetUser = await getUserObject(req, res, next);
  if (!targetUser) {
    return next(
      new HttpError(
        "Could not find the user to unfollow. (unfollow > targetUser)"
      )
    );
  }

  try {
    loggedInUser = await User.findOne({ username }).populate("followedUsers");
  } catch (err) {
    return next(
      new HttpError(
        err + ". Could not search for the loggedInUser. (follow > loggedInUser)"
      )
    );
  }
  if (!loggedInUser) {
    return next(
      // new HttpError("Could not find the loggedInUser object. (follow)")
      new HttpError("Error")
    );
  }

  // check if the targetUser (is already followed / can be unfollowed) by loggedInUser
  let followingUsernames = loggedInUser.followedUsers.map(
    (user) => user.username
  );

  if (!followingUsernames.includes(targetUser.username)) {
    return next(
      new HttpError(
        `Target user is not followed by loggedInUser. Can't unfollow.`
      )
    );
  }

  try {
    loggedInUser.followedUsers.pull(targetUser);
    await loggedInUser.save();
  } catch (err) {
    return next(
      new HttpError(
        err + ". Cannot push or save loggedInUser. (follow > save())"
      )
    );
  }

  followingUsernames = loggedInUser.followedUsers.map((user) => user.username);

  res.json({
    status: "success!",
    function: "unfollow()",
    username: loggedInUser.username,
    following: followingUsernames,
  });
};

module.exports = (app) => {
  app.get("/following/:user?", getFollowing);
  app.put("/following/:user", follow);
  app.delete("/following/:user", unfollow);
};
