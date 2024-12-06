import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Mongoose aggregate paginate simplifies fetching and processing
 * large datasets by combining advanced queries with pagination for
 * better performance and user experience.
 * Pagination Example:
 * const options = { page: 1, limit: 10 };
 * const aggregate = Comment.aggregate([{ $match: { video: videoId } }]);
 * const paginatedResults = await Comment.aggregatePaginate(aggregate, options);
 */

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
