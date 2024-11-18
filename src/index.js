import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import connectDB from "./db/dbconnect.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed: ", error);
  });
