const jwt = require("jsonwebtoken");
const authenticate = (req, res, next) => {
    const token = req.cookies?.auth;
    if (!token){
       return res.status(401).json({error: "Unauthorized"});
    }
        jwt.verify(token, process.env.JWT, (err, decoded) => {
            if (err) {
                return res.status(401).json({error: "Unauthorized"});
                
            }
            req.user = decoded;
            req.token = token;
            return next();
        })
}
module.exports = authenticate;