const { validationResult, check } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../util/http-error");
const User = require("../models/user");
const Article = require("../models/article");
const Comment = require("../models/comment");

const createArticle = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid data . Please check you inputs. (createArticle)")
    );
  }

  let allArticles, nextPid, timestamp;
  allArticles = await Article.find({});
  if (allArticles.length > 0) {
    nextPid = allArticles[allArticles.length - 1].pid + 1;
  } else {
    nextPid = 0;
  }

  timestamp = new Date();
  timestamp = timestamp.toLocaleString();

  const { text } = req.body;
  const username = req.userData.username;
  let author;

  try {
    author = await User.findOne({ username });
  } catch (err) {
    return new HttpError(err + ". Can't find user. (createArticle > author)");
  }

  if (!author) {
    return next(
      new HttpError("Cannot create post. (no mathched username. createArticle)")
    );
  }

  const createdArticle = new Article({
    pid: nextPid,
    author: username,
    text,
    date: timestamp,
    comments: [],
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdArticle.save({ session: sess });
    author.articles.push(createdArticle);
    await author.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(
        err + ". Cannot create article. (createArticle > save())",
        500
      )
    );
  }

  const ownArticles = await Article.find({ author: author.username });

  res.json({
    status: "success!",
    function: "createArticle",
    articles: ownArticles.map((article) => article.toObject({ getters: true })),
  });
};

const getArticle = async (req, res, next) => {
  const idParam = req.params.id;
  let targetUser, targetPost;

  if (idParam) {
    try {
      targetUser = await User.findOne({ username: idParam }).populate(
        "articles"
      );
    } catch (err) {
      return next(
        new HttpError(err + ". Error when searching for a user. (getArticle())")
      );
    }

    if (targetUser) {
      return res.json({
        status: "success!",
        function: "getArticle/:id?",
        username: targetUser.username,
        articles: targetUser.articles.map((post) =>
          post.toObject({ getters: true })
        ),
      });
    } else {
      let pid = Number.parseInt(idParam);
      if (isNaN(pid)) {
        return next(
          new HttpError(
            "Invalid id. The inputted id is neither an existing username nor a postId (number)."
          )
        );
      }

      try {
        targetPost = await Article.findOne({ pid });
      } catch (err) {
        return next(
          new HttpError(
            err + ". Error when searching for a post. (getArticle())"
          )
        );
      }
      if (targetPost) {
        return res.json({
          status: "success!",
          function: "getArticle/:id?",
          postId: pid,
          articles: targetPost,
        });
      } else {
        return next(new HttpError("There is no post with this pid!"));
      }
    }
  } else {
    const username = req.userData.username;
    let targetUser;

    try {
      targetUser = await User.findOne({ username: username }).populate(
        "articles"
      );
    } catch (err) {
      return next(
        new HttpError("Could not get articles. (getOwnArticles())", 500)
      );
    }

    if (!targetUser) {
      const error = new HttpError(
        "Could not get articles. (No matched user. (getOwnArticles())",
        403
      );
      return next(error);
    }

    const ownArticles = targetUser.articles.map((article) =>
      article.toObject({ getters: true })
    );

    return res.json({
      status: "success!",
      function: "getOwnArticles()",
      articles: ownArticles,
    });
  }
};

const createComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError(
        "Please input a valid comment. Comment can't be blank. (createComment)"
      )
    );
  }

  let allComments, nextCid, targetArticle, createdComment;
  const { pid, text } = req.body;
  const username = req.userData.username;

  allComments = await Comment.find({});
  if (allComments.length > 0) {
    nextCid = allComments[allComments.length - 1].cid + 1;
  } else {
    nextCid = 0;
  }

  try {
    targetArticle = await Article.findOne({ pid });
  } catch (err) {
    return next(
      new HttpError(
        err + ". Cannot search for article. (createArticle > findOne())"
      )
    );
  }
  if (!targetArticle) {
    return next(new HttpError("Article does not exist. (createComment())"));
  }

  createdComment = new Comment({
    cid: nextCid,
    username,
    text,
    adheredArticle: targetArticle["_id"],
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdComment.save({ session: sess });
    targetArticle.comments.push(createdComment);
    await targetArticle.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(
        err + ". Cannot create comment. (createComment > save())",
        500
      )
    );
  }

  res.json({
    status: "success",
    function: "createComment",
    createdComment,
    targetArticle,
  });
};

const editPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid content. 'Text' can't be blank. (createComment)")
    );
  }

  let targetArticle, targetComment;
  const { commentId, text } = req.body;
  const pid = req.params.id;
  const username = req.userData.username;

  try {
    targetArticle = await Article.findOne({ pid }).populate("comments");
  } catch (err) {
    return next(
      new HttpError(err + ". Cannot search for the article. (editPost)")
    );
  }
  if (!targetArticle) {
    return next(new HttpError("The article does not exist. (editPost)"));
  }
  if (commentId === undefined) {
    // edit the article
    if (targetArticle.author !== username) {
      return next(new HttpError("You don't own this article.", 401));
    }

    targetArticle.text = text;
    try {
      await targetArticle.save();
    } catch (err) {
      return next(
        new HttpError(
          err + ". Cannot save the article. (editPost > targetArticle.save())"
        )
      );
    }
    return res.json({
      status: "success!",
      function: "editPost - edit the article",
      articles: targetArticle,
    });
  } else if (commentId == -1) {
    // create a new comment
    let allComments, nextCid, createdComment;
    // const { pid, text } = req.body;
    // const username = req.userData.username;

    allComments = await Comment.find({});
    if (allComments.length > 0) {
      nextCid = allComments[allComments.length - 1].cid + 1;
    } else {
      nextCid = 0;
    }

    createdComment = new Comment({
      cid: nextCid,
      username,
      text,
      adheredArticle: targetArticle["_id"],
    });

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdComment.save({ session: sess });
      targetArticle.comments.push(createdComment);
      await targetArticle.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      return next(
        new HttpError(
          err + ". Cannot create comment. (createComment > save())",
          500
        )
      );
    }

    res.json({
      status: "success",
      function: "editPost - create a comment",
      articles: targetArticle,
      theCreatedComment: createdComment,
    });
  } else {
    // edit a comment
    try {
      targetComment = await Comment.findOne({ cid: commentId });
    } catch (err) {
      return next(
        new HttpError(err + ". Cannot search for the comment. (editPost)")
      );
    }
    if (!targetComment) {
      return next(new HttpError("The comment doesn't exist. (editPost)"));
    }

    // check if this user owns the comment
    if (username !== targetComment.username) {
      return next(new HttpError("You don't own this comment.", 401));
    }

    // check if the comment is under this article
    if (!targetArticle["_id"].equals(targetComment.adheredArticle)) {
      return next(new HttpError("The comment doesn't belong to this article."));
    }

    // check finished. Update the comment
    targetComment.text = text;

    try {
      await targetComment.save();
    } catch (err) {
      return next(
        new HttpError(
          err + ". Cannot save comment. (editPost > targetComment.save())"
        )
      );
    }

    // get the updated article to show it in res
    try {
      targetArticle = await Article.findOne({
        pid,
      }).populate("comments");
    } catch (err) {
      return next(
        new HttpError(
          err + ". Cannot search for the article. (editPost > last search)"
        )
      );
    }

    res.json({
      status: "success!",
      function: "editPost - edit a comment",
      articles: targetArticle,
    });
  }
};

module.exports = (app) => {
  app.get("/articles/:id?", getArticle);
  app.post("/article", [check("text").trim().not().isEmpty()], createArticle);
  app.put("/articles/:id", [check("text").trim().not().isEmpty()], editPost);
  app.post("/comment", [check("text").trim().not().isEmpty()], createComment);
};
