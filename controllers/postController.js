const cloudinary = require("cloudinary").v2;
const Notification = require("../models/notificationModel");
const Post = require("../models/postModel");
const User = require("../models/userModel");

exports.createPost = async (req, res) => {
  try {
    let { text, img } = req.body;

    if (!text && !img) {
      return res.status(400).json({
        message: "post must have text or image",
      });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const post = await Post.create({
      text,
      img,
      user: req.user._id,
    });

    res.status(200).json({
      message: "post created",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "create post error" });
  }
};
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(400).json({
        message: "post not found",
      });
    }

    if (req.user._id.toString() !== post.user.toString()) {
      return res.status(404).json({
        message: "Only Author can delete the post",
      });
    }

    if (post.img) {
      await cloudinary.uploader.destroy(
        post.img.split("/").pop().split(".")[0]
      );
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({
      message: "post deleted",
    });
  } catch (error) {
    res.status(500).json({ message: "deletePost error" });
  }
};
exports.likePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(400).json({
        message: "no such post",
      });
    }

    if (post.likes.includes(userId)) {
      const newPost = await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { likedPosts: postId },
      });
      return res.status(200).json({
        message: "post unliked",
        data: newPost,
      });
    } else {
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

      await post.save();

      const notification = await Notification.create({
        type: "like",
        from: userId,
        to: post.user,
      });
      return res.status(200).json({ message: "Hi likePost", data: post });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "likePost error" });
  }
};
exports.commentPost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        message: "enter comment",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json({
        message: "no such post",
      });
    }

    const comment = {
      text,
      user: userId,
    };

    const newComment = await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment },
    });

    res.status(200).json({
      message: "commented",
      data: newComment,
    });
  } catch (error) {
    res.status(500).json({ message: "commentPost error" });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      return res
        .status(200)
        .json({ message: "Hi getAllPosts", size: 0, data: [] });
    }

    return res
      .status(200)
      .json({ message: "Hi getAllPosts", size: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({
      message: "get all posts error",
    });
  }
};

exports.getLikedPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({
        message: "no such user",
      });
    }

    const posts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (!posts) {
      return res
        .status(200)
        .json({ message: "Hi getLikePosts", size: 0, data: [] });
    }

    return res
      .status(200)
      .json({ message: "Hi getLikePosts", size: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({
      message: "get all liked posts error",
    });
  }
};

exports.getFollowingPosts = async (req, res) => {
  try {
    const following = req.user.following;

    const posts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (!posts) {
      return res
        .status(200)
        .json({ message: "Hi getFollowingPosts", size: 0, data: [] });
    }

    return res.status(200).json({
      message: "Hi getFollowingPosts",
      size: posts.length,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      message: "get all following posts error",
    });
  }
};

exports.getPostsByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "No such user" });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ created: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (!posts) {
      return res
        .status(400)
        .json({ message: "No getPostsByUsername", size: 0, data: [] });
    }

    return res.status(200).json({
      message: "Hi getPostsByUsername",
      size: posts.length,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      message: "get all following posts error",
    });
  }
};
