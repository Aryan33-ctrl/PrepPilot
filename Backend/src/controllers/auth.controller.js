const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const tokenBlacklistModel = require("../models/blacklist.model")
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/email.service")

function handleEmailFailure(res) {
    return res.status(503).json({
        message: "Email delivery is temporarily unavailable. Please try again later."
    })
}

/**
 * Helper to generate cryptographically secure raw token and sha256 hash
 */
function generateSecureToken() {
    const rawToken = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
    return { rawToken, tokenHash }
}

/**
 * @name registerUserController
 * @description register a new user, send email verification
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        const normalizedEmail = email.toLowerCase().trim()
        const normalizedUsername = username.trim()

        const isUserAlreadyExists = await userModel.findOne({
            $or: [ { username: normalizedUsername }, { email: normalizedEmail } ]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)
        const { rawToken, tokenHash } = generateSecureToken()
        const tokenExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

        const user = await userModel.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hash,
            isVerified: false,
            verificationTokenHash: tokenHash,
            verificationTokenExpires: tokenExpires,
            lastResendSentAt: new Date()
        })

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
        const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}`

        // Send email safely (won't crash on SMTP failure)
        const emailResult = await sendVerificationEmail({
            to: user.email,
            username: user.username,
            verificationUrl
        })

        if (!emailResult.success) {
            user.resetPasswordTokenHash = undefined
            user.resetPasswordTokenExpires = undefined
            user.lastResetSentAt = undefined
            await user.save()
            return handleEmailFailure(res)
        }

        res.status(201).json({
            message: "User registered successfully! Please check your email to verify your account before logging in.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: false
            }
        })
    } catch (err) {
        console.error("Error in registerUserController:", err)
        res.status(500).json({
            message: "Server error during registration. Please try again."
        })
    }
}

/**
 * @name verifyEmailController
 * @description Verify candidate email with token
 * @access Public
 */
async function verifyEmailController(req, res) {
    try {
        const token = req.body.token || req.query.token

        if (!token) {
            return res.status(400).json({
                message: "Verification token is required"
            })
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

        const user = await userModel.findOne({
            verificationTokenHash: tokenHash,
            verificationTokenExpires: { $gt: new Date() }
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired verification token. Please request a new verification email."
            })
        }

        user.isVerified = true
        user.verificationTokenHash = undefined
        user.verificationTokenExpires = undefined
        await user.save()

        res.status(200).json({
            message: "Email verified successfully! You can now log in to your workspace."
        })
    } catch (err) {
        console.error("Error in verifyEmailController:", err)
        res.status(500).json({
            message: "Server error during email verification. Please try again."
        })
    }
}

/**
 * @name resendVerificationController
 * @description Resend verification email with rate limiting & anti-enumeration
 * @access Public
 */
async function resendVerificationController(req, res) {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email address is required"
            })
        }

        const normalizedEmail = email.toLowerCase().trim()
        const genericSuccessMsg = "If an unverified account with that email exists, a new verification link has been sent."

        const user = await userModel.findOne({ email: normalizedEmail })

        if (!user) {
            return res.status(200).json({ message: genericSuccessMsg })
        }

        if (user.isVerified) {
            return res.status(200).json({
                message: "This account is already verified. Please sign in."
            })
        }

        // Rate limit: 60 second cooldown
        if (user.lastResendSentAt && (Date.now() - new Date(user.lastResendSentAt).getTime()) < 60 * 1000) {
            const secondsLeft = Math.ceil((60 * 1000 - (Date.now() - new Date(user.lastResendSentAt).getTime())) / 1000)
            return res.status(429).json({
                message: `Please wait ${secondsLeft} seconds before requesting another verification email.`
            })
        }

        const { rawToken, tokenHash } = generateSecureToken()
        const tokenExpires = new Date(Date.now() + 30 * 60 * 1000)

        user.verificationTokenHash = tokenHash
        user.verificationTokenExpires = tokenExpires
        user.lastResendSentAt = new Date()
        await user.save()

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
        const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}`

        const emailResult = await sendVerificationEmail({
            to: user.email,
            username: user.username,
            verificationUrl
        })

        if (!emailResult.success) {
            return handleEmailFailure(res)
        }

        res.status(200).json({ message: genericSuccessMsg })
    } catch (err) {
        console.error("Error in resendVerificationController:", err)
        res.status(500).json({
            message: "Server error during resend verification. Please try again."
        })
    }
}

/**
 * @name loginUserController
 * @description login a user, checks email verification
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password"
            })
        }

        const normalizedEmail = email.toLowerCase().trim()
        const user = await userModel.findOne({ email: normalizedEmail })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        // Enforce email verification
        if (user.isVerified === false) {
            return res.status(400).json({
                message: "Please verify your email before signing in.",
                isVerified: false,
                email: user.email
            })
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Authentication is not configured."
            })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        const isProduction = process.env.NODE_ENV === "production"
        const cookieOptions = {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            path: "/",
            maxAge: 24 * 60 * 60 * 1000
        }

        res.cookie("token", token, cookieOptions)

        res.status(200).json({
            message: "User logged in successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: true
            }
        })
    } catch (err) {
        console.error("Error in loginUserController:", err)
        res.status(500).json({
            message: "Server error during login. Please try again."
        })
    }
}

/**
 * @name forgotPasswordController
 * @description Request password reset email
 * @access Public
 */
async function forgotPasswordController(req, res) {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email address is required"
            })
        }

        const normalizedEmail = email.toLowerCase().trim()
        const genericSuccessMsg = "If an account with that email exists, we have sent password reset instructions."

        const user = await userModel.findOne({ email: normalizedEmail })

        if (!user) {
            return res.status(200).json({ message: genericSuccessMsg })
        }

        // Rate limit: 60 second cooldown
        if (user.lastResetSentAt && (Date.now() - new Date(user.lastResetSentAt).getTime()) < 60 * 1000) {
            return res.status(200).json({ message: genericSuccessMsg })
        }

        const { rawToken, tokenHash } = generateSecureToken()
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        user.resetPasswordTokenHash = tokenHash
        user.resetPasswordTokenExpires = tokenExpires
        user.lastResetSentAt = new Date()
        await user.save()

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
        const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`

        const emailResult = await sendPasswordResetEmail({
            to: user.email,
            username: user.username,
            resetUrl
        })

        if (!emailResult.success) {
            return handleEmailFailure(res)
        }

        res.status(200).json({ message: genericSuccessMsg })
    } catch (err) {
        console.error("Error in forgotPasswordController:", err)
        res.status(500).json({
            message: "Server error during password reset request. Please try again."
        })
    }
}

/**
 * @name resetPasswordController
 * @description Reset user password with token
 * @access Public
 */
async function resetPasswordController(req, res) {
    try {
        const { token, password } = req.body

        if (!token || !password) {
            return res.status(400).json({
                message: "Token and new password are required"
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            })
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

        const user = await userModel.findOne({
            resetPasswordTokenHash: tokenHash,
            resetPasswordTokenExpires: { $gt: new Date() }
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired password reset token. Please request a new password reset link."
            })
        }

        const hash = await bcrypt.hash(password, 10)
        user.password = hash
        user.resetPasswordTokenHash = undefined
        user.resetPasswordTokenExpires = undefined
        await user.save()

        res.status(200).json({
            message: "Password reset successfully. You can now sign in with your new password."
        })
    } catch (err) {
        console.error("Error in resetPasswordController:", err)
        res.status(500).json({
            message: "Server error during password reset. Please try again."
        })
    }
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access Public
 */
async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token

        if (token) {
            await tokenBlacklistModel.create({ token })
        }

        res.clearCookie("token", {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/"
        })

        res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (err) {
        console.error("Error in logoutUserController:", err)
        res.status(500).json({
            message: "Server error during logout."
        })
    }
}

/**
 * @name getMeController
 * @description get current logged in user details
 * @access Private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        })
    } catch (err) {
        console.error("Error in getMeController:", err)
        res.status(500).json({
            message: "Server error fetching user details."
        })
    }
}

module.exports = {
    registerUserController,
    verifyEmailController,
    resendVerificationController,
    loginUserController,
    forgotPasswordController,
    resetPasswordController,
    logoutUserController,
    getMeController
}