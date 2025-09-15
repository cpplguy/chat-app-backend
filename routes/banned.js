const bannedIps = require("../database/bannedips.js");
const crypto = require("crypto");
const bannedAuthenticate = async (req, res, next) => {
  const hashedIp = crypto.createHash("sha256").update(req.ip).digest("hex");
  const ipBanned = await bannedIps.findOne({ ip: hashedIp });
  if (ipBanned && ipBanned.banned) {
    const reasonn = ipBanned.bannedReason
    console.log(reasonn);
    return res.status(403).json({ bannedReason: reasonn || "No reason given" });
  }
  next();
};
module.exports = bannedAuthenticate;
