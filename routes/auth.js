const authenticate = require("./authenticate.js")
const express = require("express");
const router = express.Router();
router.get("/", authenticate, (req, res) => {
    const token = req.token;
    console.log("Authenticated user: ", req.user.email, "token: ", token); 
    res.status(200).json({message: "Authenticated", user: req.user, token: token});
});
module.exports = router;