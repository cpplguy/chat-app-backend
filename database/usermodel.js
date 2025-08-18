const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "lightgray",
  },
  banned: {
    type: Boolean,
    default: false,
  },
  bannedReason:{
    type:String,
    default: "No reason specified.",
  }
});
module.exports = mongoose.model("User", schema);