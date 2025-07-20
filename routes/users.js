const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../database/usermodel");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const router = express.Router();
router.get("/", function (req, res, next) {
  res.send("W");
});
router.get("/getNames", async (req, res) => {
  const names = await User.find({});
  res.json(names.map((item) => ({ name: item.name })));
});
router.post(
  "/postUserInfo",
  body("name")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .isLength({ max: 254 })
    .withMessage("Email is too long")
    .escape(),
  async (req, res) => {
    console.log("Database: ", await User.find({}));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const info = req.body;
    if (!info.name || !info.name.match(/^\S+@\S+\.\S+$/)) {
      return res.status(400);
    }
    const inDB = await User.findOne({ email: info.name.replace(/\s/g, "_") });
    if (inDB) {
      res.sendStatus(409);
      return;
    }
    const shavedName = info.name.trim().replace(/\s/g, "_").toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(info.password, salt);
    const user = new User({ email: shavedName, password: encryptedPassword });
    try {
      const userSave = await user.save();
      console.log(userSave);
        const token = jwt.sign({ email: shavedName }, process.env.JWT, {
    expiresIn: "24h",
  });
  res.cookie("auth", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24,
  }).status(200).json({user: "logged in"});
    } catch (err) {
      console.error(err);
    }
  }
);

router.get("/getEverything", async (req, res) => {
  const auth = req.headers?.authorization;
  const compare = await bcrypt.compare(process.env.SUPER_SECRET, auth);
  if (compare) {
    res.status(200).json(await User.find({}));
    return;
  }
  res.status(403).json({ error: "Forbidden" });
});

router.post("/login", async (req, res) => {
  console.log(await User.find({}));
  const { name, password } = req.body;
  if (!name || !password) {
    return res.sendStatus(400);
  }
  const formattedName = name.trim().replace(/\s/g, "_").toLowerCase();
  const inDB = await User.findOne({
    email: formattedName,
  });
  if (!inDB) {
    return res.sendStatus(404);
  }
  const compare = await bcrypt.compare(password, inDB.password);
  if (!compare) {
    return res.sendStatus(401);
  }

  const token = jwt.sign({ email: formattedName }, process.env.JWT, {
    expiresIn: "24h",
  });
  res
    .cookie("auth", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    })
    .status(200)
    .json({ user: "logged in" });
});
router.get("/whoami", (req, res) => {
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
});
module.exports = router;
