const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const articleSchema = new Schema({
  pid: { type: Number, required: true, unique: true }, // post_id
  author: { type: String, required: true },
  text: { type: String, required: true, minLength: 1 },
  date: { type: String, required: true },
  comments: [{ type: mongoose.Types.ObjectId, required: true, ref: "Comment" }],
});

articleSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Article", articleSchema);
