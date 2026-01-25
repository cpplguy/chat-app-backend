const authenticate = require("./authenticate.js");
const bannedAuthenticate = require("./banned.js");
const express = require("express");
const bannedIps = require("../database/bannedips.js");
const router = express.Router();
router.get("/", bannedAuthenticate, authenticate, async (req, res) => {
  const token = req.token;
  console.log("Authenticated user/user logged in: ", req.user);
  //delete this
  const banned = new bannedIps({
    ip: req.ip,
    banned:false
  })
  await banned.save()
  res
    .status(200)
    .json({ message: "Authenticated", user: req.user, token: token });
});
module.exports = router;
