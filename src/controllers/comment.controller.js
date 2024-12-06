import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Video Id");
    }

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    if (pageNumber <= 0 || pageSize <= 0) {
      throw new ApiError(400, "Page and limit must be positive integers");
    }

    const video = await Video.findById(videoId).lean();

    if (!video) {
      throw new ApiError(404, "Video Not Found");
    }

    const comments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "createdBy",
          pipeline: [
            {
              $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          createdBy: {
            $first: "$createdBy",
          },
        },
      },
      {
        $project: {
          content: 1,
          createdBy: 1,
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    if (!comments) {
      throw new ApiError(500, "Error while fetching the comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments Fetched Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while fetching the message"
    );
  }
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!content) {
    throw new ApiError(400, "Comment is missing");
  }

  const user = req.user._id;

  const video = await Video.findById(videoId).lean();

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  try {
    const comment = await Comment.create({
      content,
      video: videoId,
      owner: user,
    });

    if (!comment) {
      throw new ApiError(500, "Error while publishing the comment");
    }

    const populatedComment = await comment.populate("owner", "username avatar");

    return res
      .status(201)
      .json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while publishing the comment"
    );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  if (!content) {
    throw new ApiError(400, "Comment is missing");
  }

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (String(comment.owner) !== String(req.user._id)) {
      throw new ApiError(
        403,
        "You do not have permission to update this comment"
      );
    }

    comment.content = content;
    await comment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment updated successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while updating the comment"
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid Comment Id");
    }

    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      owner: req.user._id,
    });

    if (!comment) {
      throw new ApiError(
        404,
        "Comment not found or you do not have permission to delete this comment"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment deleted successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while deleting the comment"
    );
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
