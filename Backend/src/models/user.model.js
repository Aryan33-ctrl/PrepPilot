const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "username already taken" ],
        required: true,
        trim: true
    },

    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],
        required: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verificationTokenHash: {
        type: String
    },

    verificationTokenExpires: {
        type: Date
    },

    resetPasswordTokenHash: {
        type: String
    },

    resetPasswordTokenExpires: {
        type: Date
    },

    lastResendSentAt: {
        type: Date
    },

    lastResetSentAt: {
        type: Date
    }
}, {
    timestamps: true
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel