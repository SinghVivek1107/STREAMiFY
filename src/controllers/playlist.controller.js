import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      throw new ApiError(400, "Both fields are required");
    }

    const existingPlaylist = await Playlist.findOne({
      name: name,
      owner: req.user._id,
    });

    if (existingPlaylist) {
      throw new ApiError(409, "A playlist with the same name already exists");
    }

    const playlist = await Playlist.create({
      name: name,
      description,
      owner: req.user._id,
      videos: [],
    });

    if (!playlist) {
      throw new ApiError(500, "Error while creating the playlist");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, playlist, "Playlist created Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while creating the playlist"
    );
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(403, "Unauthorized to modify this playlist");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const addToPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $addToSet: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    );

    if (!addToPlaylist) {
      throw new ApiError(500, "Error while adding the Video to the Playlist");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          addToPlaylist,
          "Video successfully added to the playlist"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while adding the Video to the Playlist"
    );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(403, "Unauthorized to modify this playlist");
    }

    const removeFromPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    );

    if (!removeFromPlaylist) {
      throw new ApiError(500, "Error while removing video the playlist");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          removeFromPlaylist,
          "Video successfully removed from the playlist"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while removing the Video from the Playlist"
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(403, "Unauthorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlist._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Playlist Deleted Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while deleting the playlist"
    );
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(403, "Unauthorized to modify this playlist");
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlist._id,
      {
        $set: updateFields,
      },
      {
        new: true,
      }
    );

    if (!updatedPlaylist) {
      throw new ApiError(
        500,
        "Something went wrong while updating the playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while updating the playlist"
    );
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const userPlaylist = await Playlist.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner", //owner of videos in playlist
              foreignField: "_id", //id of owner of videos in playlist
              as: "videosOwner",
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$videosOwner",
              },
            },
          },
          {
            $project: {
              title: 1,
              description: 1,
              thumbnail: 1,
              owner: {
                fullName: 1,
                username: 1,
                avatar: 1,
              },
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner", //owner of playlist
        foreignField: "_id", //playlist owner id
        as: "createdBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
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
        createdBy: 1,
        playlistVideo: 1,
        name: 1,
        description: 1,
      },
    },
  ]);

  if (userPlaylist.length === 0) {
    throw new ApiError(404, "No playlists found for the user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylist, "User Playlist fetched successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
