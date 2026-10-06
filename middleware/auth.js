const jwt = require("jsonwebtoken");

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

function authMiddleware(req, res, next) {

    try {

        const authHeader = req.headers.authorization;

        // Token nahi mila
        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }


        // Expected format:
        // Bearer TOKEN

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {

            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });

        }


        const token = parts[1];


        // Verify JWT

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // User information request ke andar save
        req.user = decoded;


        next();


    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }

}


// ==========================================
// ADMIN ONLY MIDDLEWARE
// ==========================================

function adminMiddleware(req, res, next) {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });

    }


    if (req.user.role !== "admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });

    }


    next();

}


module.exports = {
    authMiddleware,
    adminMiddleware
};