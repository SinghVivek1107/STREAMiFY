import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
  
    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid User ID");
    }
  
    const [videoStats, subscriberStats, likeStats] = await Promise.all([
      // Total video views and video count
      Video.aggregate([
        {
          $match: { owner: new mongoose.Types.ObjectId(userId) },
        },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
            totalVideos: { $sum: 1 },
          },
        },
        {
          $project: { _id: 0, totalViews: 1, totalVideos: 1 },
        },
      ]),
      // Total subscribers
      Subscription.aggregate([
        {
          $match: { channel: new mongoose.Types.ObjectId(userId) },
        },
        {
          $group: {
            _id: null,
            totalSubscribers: { $sum: 1 },
          },
        },
        {
          $project: { _id: 0, totalSubscribers: 1 },
        },
      ]),
      // Total likes
      Like.aggregate([
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "videoInfo",
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "comment",
            foreignField: "_id",
            as: "commentInfo",
          },
        },
        {
          $match: {
            $or: [
              { "videoInfo.owner": userId },
              { "commentInfo.owner": userId },
            ],
          },
        },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: 1 },
          },
        },
        {
          $project: { _id: 0, totalLikes: 1 },
        },
      ]),
    ]);
  
    // Handling cases where any aggregation returns an empty array
    const stats = {
      totalViews: videoStats[0]?.totalViews || 0,
      totalVideos: videoStats[0]?.totalVideos || 0,
      totalSubscribers: subscriberStats[0]?.totalSubscribers || 0,
      totalLikes: likeStats[0]?.totalLikes || 0,
    };
  
    return res
      .status(200)
      .json(new ApiResponse(200, stats, "Channel Stats Fetched"));
  });
  

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const { page = 1, limit = 10, isPublished } = req.query;

  const matchCondition = {
    owner: new mongoose.Types.ObjectId(userId),
    ...(isPublished !== undefined && { isPublished: isPublished === "true" }),
  };
  const videos = await Video.aggregate([
    {
      $match: {
        matchCondition,
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) },
  ]);

  if (videos.length === 0) {
    throw new ApiError(404, "No video found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, videos, "User channel videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };
