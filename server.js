const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: "./config.env" });

const app = require("./app");

const db = process.env.DATABASE_URL.replace(
  "<db_password>",
  process.env.DB_PASSWORD
);
const mongoClient = mongoose
  .connect(db)
  .then((res) => console.log("db connected successfully"));

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log("connected to port");
});
