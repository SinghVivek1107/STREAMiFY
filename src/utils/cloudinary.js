import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import { v2 as cloudinary } from "cloudinary";
import { asyncHandler } from "./asyncHandler.js";
import fs from "fs";
import { ApiError } from "./apiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);*/

const uploadOnCloudinary = asyncHandler(async (localFilePath) => {
  if (!localFilePath) {
    throw new ApiError(400, "File path is required for upload");
  }

  //upload the file on cloudinary
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //console.log("Response: ", response);
    //console.log("File is uploaded successfully ", response.url);

    return response;
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Failed to upload file to Cloudinary"
    );
  } finally {
    try {
      fs.promises.unlink(localFilePath);
    } catch (error) {
      console.error("Failed to delete local file:", error);
    }
  }
});

export { uploadOnCloudinary };
