import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  if (
    isNaN(pageNumber) ||
    isNaN(pageSize) ||
    pageNumber <= 0 ||
    pageSize <= 0
  ) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  try {
    const matchFilter = {
      $or: [
        {
          title: { $regex: query, $options: "i" },
        },
        {
          description: { $regex: query, $options: "i" },
        },
      ],
    };

    if (userId) {
      if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id");
      }
      matchFilter.owner = new mongoose.Types.ObjectId(userId);
    }

    const videos = await Video.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: "$createdBy",
      },
      {
        $project: {
          thumbnail: 1,
          videoFile: 1,
          title: 1,
          description: 1,
          createdBy: {
            fullName: 1,
            username: 1,
            avatar: 1,
          },
        },
      },

      { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
      { $skip: (pageNumber - 1) * pageSize },
      { $limit: pageSize },
    ]);

    const totalVideos = await Video.countDocuments(matchFilter)

    return res.
    status(200)
    .json(
      new ApiResponse(
        200,
        {
          videos,
          pagination: {
            totalVideos,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalVideos / pageSize),
          },
        },
        "Fetched All Videos"
      )
    )
  } catch (error) {
    throw new ApiError(500, error.message || "An error occurred while fetching videos");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      throw new ApiError(400, "Title and description are required");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;

    if (!videoFileLocalPath) {
      throw new ApiError(400, "No video file found");
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalPath) {
      throw new ApiError(400, "No thumbnail file found");
    }

    const [videoFile, thumbnail] = await Promise.all([
      uploadOnCloudinary(videoFileLocalPath),
      uploadOnCloudinary(thumbnailLocalPath),
    ]);

    if (!videoFile.url) {
      throw new ApiError(500, "Error while uploading the video");
    }

    if (!thumbnail.url) {
      throw new ApiError(500, "Error while uploading the thumbnail");
    }

    const video = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration: videoFile.duration,
      owner: req.user._id,
    });

    if (!video) {
      throw new ApiError(500, "Error while publishing the video");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video Published Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while uploading the video"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "No video found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while fetching the Video");
  }
});

//TODO: update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    // Validate input
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Video Id");
    }

    if (!title && !description && !thumbnailLocalPath) {
      throw new ApiError(400, "No valid fields to update");
    }

    // Upload thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
      throw new ApiError(500, "Error while uploading the thumbnail");
    }

    // Update video in database
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
          thumbnail: thumbnail.url,
        },
      },
      { new: true }
    );

    if (!updatedVideo) {
      throw new ApiError(404, "No video found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Video Updated Successfully"));
  } catch (error) {
    // Centralized error handling
    console.error(error);
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(500, "No video found");
    }

    await Video.findByIdAndDelete(videoId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video Deleted Successfully"));
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No Video found");
  }

  video.isPublished = !video.isPublished;

  const updatedVideo = await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Publish status toggled successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
