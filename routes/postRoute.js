const express = require("express");
const { protectedRoute } = require("../controllers/authController");
const postController = require("../controllers/postController");

const router = express.Router();

router.get("/all", protectedRoute, postController.getAllPosts);
router.get("/likes/:id", protectedRoute, postController.getLikedPosts);
router.get("/following", protectedRoute, postController.getFollowingPosts);
router.get(
  "/user/:username",
  protectedRoute,
  postController.getPostsByUsername
);

router.post("/create", protectedRoute, postController.createPost);
router.delete("/:id", protectedRoute, postController.deletePost);
router.post("/like/:id", protectedRoute, postController.likePost);
router.post("/comment/:id", protectedRoute, postController.commentPost);

module.exports = router;
