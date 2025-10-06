const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userProfile = await User.findById(id).select("-password");

    if (!userProfile) {
      res.status(400).json({
        message: "no such user",
      });
    }

    return res.status(200).json({
      message: " user profile ",
      data: userProfile,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "get user profile error",
    });
  }
};

exports.followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        message: "user cannot follow/unfollow himself",
      });
    }

    const userToModify = await User.findById(id).select("-password");
    if (!userToModify)
      return res.status(400).json({
        message: "no user to follow found",
      });

    const currentUser = await User.findById(req.user._id).select("-password");
    if (!currentUser)
      return res.status(400).json({
        message: "no current user",
      });

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });

      return res.status(200).json({
        message: "user unfollow success",
      });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await Notification.create({
        from: req.user._id,
        to: id,
        type: "follow",
      });

      return res.status(200).json({
        message: "user follow success",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "get user profile error",
    });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    const usersFollwowedByme = await User.findById(req.user._id).select(
      "following"
    );

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: req.user._id },
        },
      },
      {
        $sample: {
          size: 10,
        },
      },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollwowedByme.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json({
      message: "getSuggestedUsers",
      data: suggestedUsers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "getSuggestedUsers error",
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const {
      username,
      fullname,
      email,
      bio,
      link,
      currentPassword,
      newPassword,
    } = req.body;

    let { profileImg, coverImg } = req.body;

    const userId = req.user._id;

    let user = await User.findById(userId);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "provide current and new password",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({
          message: "wrong password",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }

      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    user.fullname = fullname || user.fullname;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;
    user = await user.save();

    user.password = null;

    return res
      .status(200)
      .json({ message: "Hi updateUserProfile", data: user });
  } catch (error) {
    res.status(500).json({
      message: "update user error",
    });
  }
};
