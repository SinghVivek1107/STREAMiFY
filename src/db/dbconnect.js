import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}${DB_NAME}`
    );
    console.log(
      `\n MONGODB connected !! DB_Host ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Connection Error: ", error);
    process.exit(1);
  }
};

export default connectDB;
