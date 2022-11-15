const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const corsOption = { origin: "http://localhost:3000", credentials: true };
const corsHeaderSetting = require("./util/cors-header");

const error_handler = require("./util/error-handle");
const auth = require("./controllers/auth-controller");
const profile = require("./controllers/profile-controller");
const article = require("./controllers/article-controller");
const following = require("./controllers/following-controller");

const app = express();

app.use(cors(corsOption));
corsHeaderSetting(app);

app.use(bodyParser.json());
app.use(cookieParser());

auth(app);
profile(app);
article(app);
following(app);
error_handler(app);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.veefktm.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(process.env.PORT || 4000);
  })
  .catch((err) => {
    console.log(`mongoose.connect error: ${err}`);
  });
