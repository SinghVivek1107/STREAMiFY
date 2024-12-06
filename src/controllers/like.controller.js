import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const user = req.user._id;

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: user,
  });

  if (existingLike) {
    // Unlike the video
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video unliked successfully"));
  }

  // Like the video
  const like = await Like.create({
    video: videoId,
    likedBy: user,
  });

  if (!like) {
    throw new ApiError(500, "Error while liking the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const user = req.user._id;

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: user,
  });

  if (existingLike) {
    // Unlike the comment
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked successfully"));
  }

  // Like the comment
  const like = await Like.create({
    comment: commentId,
    likedBy: user,
  });

  if (!like) {
    throw new ApiError(500, "Error while liking the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Comment liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const likedVideos = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(req.user._id),
          video: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      avatar: 1,
                      username: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] },
              },
            },
            {
              $project: {
                videoFile: 1,
                title: 1,
                thumbnail: 1,
                description: 1,
                duration: 1,
                views: 1,
                owner: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$video",
      },
      {
        $project: {
          video: 1,
        },
      },
    ]);

    if (!likedVideos || likedVideos.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, [], "No liked videos found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, likedVideos, "Fetched Liked Videos Successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "An error occurred while fetching liked videos"
    );
  }
});

export { toggleCommentLike, toggleVideoLike, getLikedVideos };
