import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//import routes
import userRouter from "./routes/user.routes.js";

//routes
app.use("/api/v1/user", userRouter);

// http://localhost:8000/api/v1/users/register

export { app };
