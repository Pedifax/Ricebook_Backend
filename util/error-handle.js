const HttpError = require("./http-error");

const unknown_route_handle = (req, res, next) => {
  const error = new HttpError("Unknown Route", 404);
  return next(error);
};

const error_handle = (error, req, res, next) => {
  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown error." });
};

module.exports = (app) => {
  app.use(unknown_route_handle);
  app.use(error_handle);
};
