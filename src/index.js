import dotenv from "dotenv";
dotenv.config({});

import connectDB from "./db/dbconnect.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    console.log(`App is listening on port ${PORT}`);
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed: ", error);
  });


  

/*(async () => {
    try {
      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
      console.log("Connected to MongoDB");

      app.on("error", (error) => {
        console.log("SERVER ERROR: ", error);
      });

      app.listen(PORT, () => {
        console.log(`App is listening on port ${PORT}`);
      });
    } catch (error) {
      console.log("CONNECION ERROR: ", error);
      throw error;
    }
  })();*/
