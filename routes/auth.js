const authenticate = require("./authenticate.js")
const express = require("express");
const router = express.Router();
router.get("/", authenticate, (req, res) => { 
    res.status(200).json({message: "Authenticated", user: req.user});
});
module.exports = router;