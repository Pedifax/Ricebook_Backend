const multer = require("multer");
const stream = require("stream");
const { v4: uuid } = require("uuid");
// const { cloudinary } = require("../util/cloudinary");
const cloudinary = require("cloudinary");

// const IMAGE_TYPE_TABLE = {
//   "image/png": "png",
//   "image/jpeg": "jpeg",
//   "image/jpg": "jpg",
// };

// const multerUpload = multer({
//   limits: 20971520, // bytes limitation
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads"); // callback function
//     },
//     filename: (req, file, cb) => {
//       const ext = IMAGE_TYPE_TABLE[file.mimetype]; // extract the extension of the incoming file
//       cb(null, uuid() + "." + ext);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     const isValid = !!IMAGE_TYPE_TABLE[file.mimetype];
//     // !! converts undefined to true then to false, and converts true to false to true, so it can be a boolean indicator
//     let error = isValid ? null : new Error("Invalid mime type!");
//     cb(error, isValid);
//   },
// });

const doUpload = (publicId, req, res, next) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    (result) => {
      // capture the url and public_id and add to the request
      req.fileurl = result.url;
      req.fileid = result.public_id;
      next();
    },
    { public_id: uuid() }
  );

  // multer can save the file locally if we want
  // instead of saving locally, we keep the file in memory
  // multer provides req.file and within that is the byte buffer

  // we create a passthrough stream to pipe the buffer
  // to the uploadStream function for cloudinary.
  const s = new stream.PassThrough();
  s.end(req.file.buffer);
  s.pipe(uploadStream);
  s.on("end", uploadStream.end);
  // and the end of the buffer we tell cloudinary to end the upload.
};

// multer parses multipart form data.  Here we tell
// it to expect a single file upload named 'image'
// Read this function carefully so you understand
// what it is doing!
const multerUpload = (publicId) => (req, res, next) => {
  multer().single(publicId)(req, res, () => {
    doUpload(publicId, req, res, next);
  });
};

module.exports = multerUpload;
