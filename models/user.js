const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  articles: [{ type: mongoose.Types.ObjectId, required: true, ref: "Article" }],
  followedUsers: [
    { type: mongoose.Types.ObjectId, requied: true, ref: "User" },
  ],
  googleAuth: { type: Boolean, required: true, default: false },
});

// ensures the username is unique
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema); // This "User" will be the name of its collections in MongoDB (in lowercase)
