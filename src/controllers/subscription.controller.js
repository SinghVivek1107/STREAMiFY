import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const user = req.user._id;

  try {
    const existingSubscription = await Subscription.findOne({
      subscriber: user,
      channel: channelId,
    });

    if (existingSubscription) {
      await Subscription.findByIdAndDelete(existingSubscriber._id);

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Channel Unsubscribed Successfully"));
    }

    const newSubscription = await Subscription.create({
      channel: channelId,
      subscriber: user,
    });

    if (!newSubscription) {
      throw new ApiError(500, "Error while subscribing the channel");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, newSubscription, "Channel Subscribed Successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "An error occurred while toggling the subscription"
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscribersId } = req.params;

  if (!isValidObjectId(subscribersId)) {
    throw new ApiError(400, "Invalid subscriber Id");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscribersId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "susbscibers",
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
        subscriberDetails: { $arrayElemAt: ["$subscribers", 0] },
      },
    },
    {
      $project: {
        subscriberDetails: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!subscribers || subscribers.length === 0) {
    throw new ApiError(404, "No subscribers found for this channel");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Number of subscribers fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedTo",
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
        subscribedToDetails: { $arrayElemAt: ["$subscribedTo", 0] },
      },
    },
    {
      $project: {
        subscribedToDetails: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!subscribedChannels || subscribedChannels.length === 0) {
    throw new ApiError(404, "User is not subscribed to any channels");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      subscribedChannels,
      "Subscribed channels fetched successfully"
    )
  );
});


export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
