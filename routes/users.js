const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const userModel = require("../database/usermodel");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const router = express.Router();
router.get("/", (req, res, next) => {
  res.send("W");
});

async function filterUsernames() {
  const userSet = new Set();
  const users = await usermodel.find({}).lean();
  for (const user of users) {
    if (userSet.has(user.email)) {
      await usermodel.deleteOne({ _id: user._id });
      continue;
    }
    userSet.add(user.email);
  }
}

router.get("/getNames", async (req, res) => {
  const names = await User.find({});
  res.json(names.map((item) => ({ name: item.name })));
});
router.delete("/logout", (req, res) => {
  try {
    res.clearCookie("auth", {
      httpOnly: true,
      secure: process.env.STATUS === "development" ? false : true,
      sameSite: process.env.STATUS === "development" ? "Lax" : "none",
      path: "/",
    });
    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err });
  }
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
    if (!info.name) {
      return res.status(400);
    }
    const shavedName = info.name.trim().toLowerCase();
    const inDB = await User.findOne({ email: shavedName });
    if (inDB) {
      res.sendStatus(409);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(info.password, salt);
    const user = new User({
      email: shavedName,
      password: encryptedPassword,
      color:
        shavedName === "admin@admin.com"
          ? "rainbow"
          : `rgb(${Math.random() * 255},${Math.random() * 255},${
              Math.random() * 255
            })`,
      ip: crypto.createHash("sha256").update(req.ip).digest("hex"),
    });
    try {
      const userSave = await user.save();
      console.log(userSave);
      const token = jwt.sign({ email: shavedName }, process.env.JWT, {
        expiresIn: "100h",
      });
      filterUsernames();
      res
        .cookie("auth", token, {
          httpOnly: true,
          secure: process.env.STATUS === "development" ? false : true,
          sameSite: process.env.STATUS === "development" ? "Lax" : "none",
          maxAge: 1000 * 60 * 60 * 100, //100 hours
          path: "/",
        })
        .status(201)
        .json({ user: shavedName, token: token });
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
  const { name, password } = req.body;
  if (!name || !password) {
    return res.sendStatus(400);
  }
  const formattedName = name.trim().toLowerCase();
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
  inDB.ip = crypto.createHash("sha256").update(req.ip).digest("hex");
  await inDB.save();
  const token = jwt.sign({ email: formattedName }, process.env.JWT, {
    expiresIn: "100h",
  });
  filterUsernames();
  res
    .cookie("auth", token, {
      httpOnly: true,
      secure: process.env.STATUS === "development" ? false : true,
      sameSite: process.env.STATUS === "development" ? "Lax" : "none",
      maxAge: 1000 * 60 * 60 * 100, // 100 hours
      path: "/",
    })
    .status(200)
    .json({ user: formattedName, token: token });
});
module.exports = router;
