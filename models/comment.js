const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  cid: { type: Number, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true, minLength: 1 },
  adheredArticle: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Article",
  },
});

module.exports = mongoose.model("Comment", commentSchema);
