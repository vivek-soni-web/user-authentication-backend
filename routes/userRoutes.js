const express = require("express");
const Joi = require("joi");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    getProfile,
    updateProfile,
    uploadProfileImage
} = require("../controllers/userController");

const router = express.Router();

const updateProfileSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50),

    mobile: Joi.string()
        .pattern(/^[0-9]{10}$/)
}).min(1);

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        next();
    };
};

router.get(
    "/profile",
    authMiddleware,
    getProfile
);

router.put(
    "/profile",
    authMiddleware,
    validate(updateProfileSchema),
    updateProfile
);

router.put(
    "/profile/image",
    authMiddleware,
    upload.single("image"),
    uploadProfileImage
);

module.exports = router;