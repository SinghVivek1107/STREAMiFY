import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");  // Save files in the "public/temp" folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Save the file with its original name
  },
});

export const upload = multer({
  storage,
});
