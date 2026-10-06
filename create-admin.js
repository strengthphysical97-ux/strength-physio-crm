const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const User = require("./models/User");

require("dotenv").config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createAdmin() {

    try {

        await mongoose.connect(process.env.MONGO_URL);

        console.log("MongoDB Connected");

        rl.question("Admin Name: ", async (name) => {

            rl.question("Admin Email: ", async (email) => {

                rl.question("Admin Password: ", async (password) => {

                    const existingUser = await User.findOne({
                        email: email.toLowerCase()
                    });

                    if (existingUser) {

                        console.log("User already exists!");

                        rl.close();
                        await mongoose.disconnect();

                        return;
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);

                    const admin = new User({
                        name: name,
                        email: email.toLowerCase(),
                        password: hashedPassword,
                        role: "admin"
                    });

                    await admin.save();

                    console.log("Admin user created successfully!");

                    rl.close();
                    await mongoose.disconnect();

                });

            });

        });

    } catch (error) {

        console.error("Error:", error.message);

        rl.close();
        await mongoose.disconnect();

    }
}

createAdmin();