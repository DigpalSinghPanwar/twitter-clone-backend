const Notification = require("../models/notificationModel");

exports.getNotification = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });

    await Notification.updateMany({ to: userId }, { read: true });
    if (notifications.length === 0) {
      return res.status(200).json({
        message: "get notification ",
        data: notifications,
      });
    }

    res.status(200).json({
      message: "get notification ",
      data: notifications,
      size: notifications.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "get notification error",
    });
  }
};
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    res.status(200).json({
      message: "delete notification",
    });
  } catch (error) {
    return res.status(500).json({
      message: "delete notification error",
    });
  }
};
