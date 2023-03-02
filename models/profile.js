const mongoose = require("mongoose");
// const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const profileSchema = new Schema({
  username: { type: String, requied: true },
  // displayName: { type: String, required: true },
  displayName: { type: String, required: false },
  headline: { type: String, required: true, minlength: 1 },
  email: { type: String, required: true },
  phone: { type: String, required: false },
  zip: { type: String, required: false },
  avatar: { type: String, required: true },
  dob: { type: String, required: false },
});

module.exports = mongoose.model("Profile", profileSchema);
