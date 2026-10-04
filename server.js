require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express(); 

// Middleware
app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

// Connect MongoDB
connectDB();

// Home route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Authentication & User Profile API is running"
    });
});

// Auth routes
app.use(
    "/api/auth",
    authRoutes
);

// User routes
app.use(
    "/api/user",
    userRoutes
);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);

    return res.status(500).json({
        success: false,
        message: err.message || "Something went wrong"
    });
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});