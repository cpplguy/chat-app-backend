const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const userModel = require("../database/usermodel.js");
const bannedIps = require("../database/bannedips.js");
const authenticate = require("./authenticate.js");
const adminAuthenticate = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Not an admin" });
  }
  next();
};
router.use(authenticate);
router.use(adminAuthenticate);
router.get("/", (req, res) => {
  res.status(200).json({ message: "Admin authenticated" });
});
router.get("/users", async (req, res) => {
  try {
    let users = await userModel.find({}).lean();
    users = users.map((item) => {
      const { password, ip = "", ...rest } = item;
      return rest;
    });
    return res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users: ", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/users/delete", async (req, res) => {
  const usernameToDelete = req.body.userId;

  if (!usernameToDelete) {
    return res.status(400).json({ error: "UserId is required" });
  }
  const userToDelete = await userModel.findOne({ _id: usernameToDelete });
  if (!userToDelete) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    await userToDelete.deleteOne();
    console.log("User deleted successfully: ", userToDelete.email);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user: ", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.patch("/users/ban", async (req, res) => {
  const userToBan = req.body.userId;
  const bannedMessage = req.body.message || "No reason provided";
  if (!userToBan) {
    return res.status(400).json({ error: "Id is required" });
  }
  const user = await userModel.findOne({ _id: userToBan });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  try {
    if (user.banned) {
      user.banned = false;
      user.bannedReason = "";
      await user.save();
      return res.status(200).json({ message: "User unbanned successfully" });
    }
    user.banned = true;
    user.bannedReason = bannedMessage;
    await user.save();
    return res.status(200).json({ message: "User banned successfully" });
  } catch (err) {
    console.error("Error banning user: ", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/users/ipban", async (req, res) => {
  try {
    const userToBan = req.body.userId;
    if (!userToBan) return res.status(400).json({ error: "Id is required" });
    const [bannedMessage, unBanOrNot] = req.body.message.split(":");
    const user = await userModel.findOne({ _id: userToBan });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isBanned = await bannedIps.findOne({ ip: user.ip });
    // dont forget that i added ts
    if (isBanned) {
      if (unBanOrNot?.toLowerCase() !== "unban")
        return res.status(409).json({ error: "duplicate ip addresses" });
      isBanned.banned = false;
      await isBanned.save();
      return;
    }
    const ipBan = new bannedIps({
      ip: user.ip,
      bannedReason: bannedMessage,
    });
    await ipBan.save();
  } catch (err) {
    console.error("Error ip banning user: ", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
