const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
    authMiddleware,
    adminMiddleware
} = require("../middleware/auth");

// ===============================
// GET ALL STAFF
// ===============================


router.get("/", authMiddleware, adminMiddleware, async (req, res) => {

    try {

        const users = await User
            .find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users: users
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// STAFF LIST (ADMIN + STAFF)
router.get("/staff", authMiddleware, async (req, res) => {
    try {
        const users = await User.find({ role: "staff" })
            .select("name email role")
            .sort({ name: 1 });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// ===============================
// CREATE STAFF
// ===============================

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            role
        } = req.body;


        // Check required fields

        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });

        }


        // Check existing user

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {

            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user

        const user = new User({

            name: name,

            email: email.toLowerCase(),

            password: hashedPassword,

            role: role || "staff"

        });


        const savedUser =
            await user.save();


        res.status(201).json({

            success: true,

            message: "Staff created successfully",

            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role
            }

        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ===============================
// DELETE USER
// ===============================

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {

    try {

        const deletedUser =
            await User.findByIdAndDelete(req.params.id);


        if (!deletedUser) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }


        res.json({

            success: true,

            message: "User deleted successfully"

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

});


module.exports = router;