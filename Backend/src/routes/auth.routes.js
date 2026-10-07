const { Router } = require('express')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const authRouter = Router()

/**
 * @route POST /api/auth/register
 * @description Register a new user and send email verification
 * @access Public
 */
authRouter.post("/register", authController.registerUserController)

/**
 * @route POST /api/auth/verify-email
 * @description Verify candidate email address using token
 * @access Public
 */
authRouter.post("/verify-email", authController.verifyEmailController)

/**
 * @route POST /api/auth/resend-verification
 * @description Resend verification email to candidate
 * @access Public
 */
authRouter.post("/resend-verification", authController.resendVerificationController)

/**
 * @route POST /api/auth/login
 * @description Login user with email and password
 * @access Public
 */
authRouter.post("/login", authController.loginUserController)

/**
 * @route POST /api/auth/forgot-password
 * @description Send password reset link to user's email
 * @access Public
 */
authRouter.post("/forgot-password", authController.forgotPasswordController)

/**
 * @route POST /api/auth/reset-password
 * @description Reset user password with token
 * @access Public
 */
authRouter.post("/reset-password", authController.resetPasswordController)

/**
 * @route GET /api/auth/logout
 * @description Clear token from user cookie and add the token to blacklist
 * @access Public
 */
authRouter.get("/logout", authController.logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description Get current logged in user details
 * @access Private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

module.exports = authRouter