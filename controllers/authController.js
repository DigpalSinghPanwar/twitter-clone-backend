const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(400).json({
        message: "token not found",
      });
    }

    const decode = await jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decode);
    if (!decode) {
      res.status(401).json({
        message: "token invalid",
      });
    }

    const newuser = await User.findById(decode.userId).select("-password");
    if (!newuser) {
      return res
        .status(400)
        .json({ status: "fail", message: "user not found" });
    }
    // console.log(newuser);
    req.user = newuser;
    next();
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const createNewToken = (userId, res) => {
  const token = jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
  res.cookie("jwt", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};

exports.signin = async (req, res) => {
  try {
    const user = req.body;
    if (!user.email || !user.password) {
      return res.status(400).json({
        message: "email or password  error",
      });
    }

    const userExists = await User.findOne({ email: user.email });
    if (
      !userExists ||
      !(await bcrypt.compare(user.password, userExists.password || ""))
    ) {
      return res.status(401).json({
        message: "no signin",
      });
    }

    const token = createNewToken(userExists._id, res);
    userExists.password = undefined;

    res.status(200).json({
      status: "success signin",
      token,
      data: userExists,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.signup = async (req, res) => {
  try {
    const user = req.body;
    // console.log(user);

    if (!user.username || !user.email || !user.password || !user.fullname) {
      return res.status(400).json({
        message: "provide user details",
      });
    }

    const userExists = await User.findOne({ username: user.username });
    if (userExists) {
      return res.status(400).json({
        message: "username already exists",
      });
    }

    const emailExists = await User.findOne({ email: user.email });
    if (emailExists) {
      return res.status(400).json({
        message: "email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(user.password, salt);

    const newUser = await User.create({
      username: user.username,
      email: user.email,
      password: hashPassword,
      fullname: user.fullname,
    });

    if (!newUser) {
      return res.status(400).json({
        message: "User create error",
      });
    }

    const token = createNewToken(newUser._id, res);
    // console.log(newUser);
    newUser.password = undefined;
    res.status(201).json({
      status: "success signup",
      token,
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.signout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({
      status: "success signout",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
