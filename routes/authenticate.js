const jwt = require("jsonwebtoken");
const Users = require("../database/usermodel.js");
const authenticate = (req, res, next) => {
    const token = req.cookies?.auth;
    if (!token){
       return res.status(401).json({error: "Unauthorized"});
    }
        jwt.verify(token, process.env.JWT, async(err, decoded) => {
            if (err) {
                return res.status(401).json({error: "Unauthorized"});
                
            }
            req.user = decoded.email;
            req.token = token;
            req.isAdmin = req.user === "admin@admin.com";
            const user = await Users.findOne({email:req.user})
            if(user.banned){
                const reason = user.bannedReason
                return res.status(403).json({ bannedReason: reason || "No reason given" })
            }
            return next();
        })
}
module.exports = authenticate;