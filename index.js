const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const corsHeaderSetting = require("./util/cors-header");
const passport = require("passport");
const cors = require("cors");
const corsOption = {
  origin: ["http://localhost:4000", "https://ricebook-bk.surge.sh"],
  credentials: true,
};

const oauthRoutes = require("./routes/oauth");
const error_handler = require("./util/error-handle");
const auth = require("./controllers/auth-controller");
const profile = require("./controllers/profile-controller");
const article = require("./controllers/article-controller");
const following = require("./controllers/following-controller");
const oauth = require("./controllers/OAuth-controller");

const app = express();
app.use(cors(corsOption));

app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));
// app.use(express.json({ limit: "20mb" }));
// app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// corsHeaderSetting(app);

app.use(bodyParser.json());
app.use(cookieParser());

app.use("/oauth", oauthRoutes);

oauth(app);
auth(app);
profile(app);
article(app);
following(app);
error_handler(app);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mycluster.qozaawu.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    const port = process.env.PORT || 4000;
    app.listen(port, () =>
      console.log(`Listening on http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.log(`mongoose.connect error: ${err}`);
  });
