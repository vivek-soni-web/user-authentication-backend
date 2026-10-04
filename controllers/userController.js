const User = require("../models/User");
const cloudinary = require("../config/cloudinary");


// =======================
// GET PROFILE
// =======================

const getProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user.userId)
            .select("-password");

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        return res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to get profile"
        });

    }
};


// =======================
// UPDATE PROFILE
// =======================

const updateProfile = async (req, res) => {

    try {

        const { name, mobile } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        if (name) {
            user.name = name;
        }

        if (mobile) {
            user.mobile = mobile;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                profileImage: user.profileImage
            }
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });

    }
};


// =======================
// UPLOAD PROFILE IMAGE
// =======================

const uploadProfileImage = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Please upload an image"
            });

        }

        const user = await User.findById(req.user.userId);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }


        // Delete old image from Cloudinary
        if (user.profileImage && user.profileImage.public_id) {

            await cloudinary.uploader.destroy(
                user.profileImage.public_id
            );

        }


        // Upload new image to Cloudinary
        const result = await new Promise((resolve, reject) => {

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "user_profiles"
                },

                (error, result) => {

                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }

                }
            );

            uploadStream.end(req.file.buffer);

        });


        // Save new image information
        user.profileImage = {

            secure_url: result.secure_url,

            public_id: result.public_id

        };

        await user.save();


        return res.status(200).json({

            success: true,

            message: "Profile image uploaded successfully",

            profileImage: user.profileImage

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload profile image"
        });

    }
};


module.exports = {
    getProfile,
    updateProfile,
    uploadProfileImage
};