const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
router.post("/chatroom", (req, res) => {
  res.send("route hit");
});
router.get("/whoami", (req, res) => {
  try {
    const token = req.cookies?.auth;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    jwt.verify(token, process.env.JWT, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      console.log("Accessed whoami:  ", decoded.email);
      res.status(200).json({ email: decoded.email });
    });
  } catch (err) {
    console.error(err);
  }
});
module.exports = router;
