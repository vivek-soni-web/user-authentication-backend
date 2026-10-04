const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");

const generateOTP = require("../utils/generateOTP");
const sendOTPEmail = require("../utils/sendEmail");


// =======================
// SIGNUP
// =======================

const signup = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        const normalizedEmail = email.toLowerCase();

        let user = await User.findOne({
            email: normalizedEmail
        });

        if (user && user.isVerified) {

            return res.status(400).json({
                success: false,
                message: "User already exists"
            });

        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        if (user && !user.isVerified) {

            user.name = name;
            user.password = hashedPassword;

            await user.save();

        } else {

            user = await User.create({
                name: name,
                email: normalizedEmail,
                password: hashedPassword
            });

        }

        const otp = generateOTP();

        await OTP.deleteMany({
            email: normalizedEmail
        });

        await OTP.create({

            email: normalizedEmail,

            otp: await bcrypt.hash(otp, 10),

            expiresAt: new Date(
                Date.now() + 10 * 60 * 1000
            )

        });

        await sendOTPEmail(
            normalizedEmail,
            otp
        );

        return res.status(201).json({
            success: true,
            message: "Signup successful. OTP sent to your email."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Signup failed"
        });

    }
};


// =======================
// VERIFY OTP
// =======================

const verifyOTP = async (req, res) => {

    try {

        const { email, otp } = req.body;

        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        const otpRecord = await OTP.findOne({
            email: normalizedEmail
        });

        if (!otpRecord) {

            return res.status(400).json({
                success: false,
                message: "OTP not found or expired"
            });

        }

        if (new Date() > otpRecord.expiresAt) {

            await OTP.deleteOne({
                _id: otpRecord._id
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });

        }

        const isCorrectOTP = await bcrypt.compare(
            otp,
            otpRecord.otp
        );

        if (!isCorrectOTP) {

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });

        }

        user.isVerified = true;

        await user.save();

        await OTP.deleteOne({
            _id: otpRecord._id
        });

        return res.status(200).json({
            success: true,
            message: "Account verified successfully"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });

    }
};


// =======================
// RESEND OTP
// =======================

const resendOTP = async (req, res) => {

    try {

        const { email } = req.body;

        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        if (user.isVerified) {

            return res.status(400).json({
                success: false,
                message: "User is already verified"
            });

        }

        const otp = generateOTP();

        await OTP.deleteMany({
            email: normalizedEmail
        });

        await OTP.create({

            email: normalizedEmail,

            otp: await bcrypt.hash(otp, 10),

            expiresAt: new Date(
                Date.now() + 10 * 60 * 1000
            )

        });

        await sendOTPEmail(
            normalizedEmail,
            otp
        );

        return res.status(200).json({
            success: true,
            message: "New OTP sent successfully"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP"
        });

    }
};


// =======================
// LOGIN
// =======================

const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        if (!user.isVerified) {

            return res.status(403).json({
                success: false,
                message: "Please verify your email first"
            });

        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({

            success: true,

            message: "Login successful",

            token: token

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });

    }
};


// =======================
// EXPORT
// =======================

module.exports = {
    signup,
    verifyOTP,
    resendOTP,
    login
};