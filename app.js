const express = require("express");
const authRouter = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());

// app.get("/", (req, res) => {
//   res.send("hello world");
// });

app.use("/api/v1/auth", authRouter);

module.exports = app;
