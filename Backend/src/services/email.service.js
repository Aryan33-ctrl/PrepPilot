const nodemailer = require("nodemailer")

/**
 * Creates and returns Nodemailer SMTP Transporter
 */
function createTransporter() {
    const host = process.env.SMTP_HOST || "smtp.gmail.com"
    const port = parseInt(process.env.SMTP_PORT || "587", 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASSWORD

    if (!user || !pass) {
        return null
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        auth: {
            user,
            pass
        }
    })
}

async function verifyEmailTransporter() {
    const transporter = createTransporter()

    if (!transporter) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("SMTP_USER and SMTP_PASSWORD are required in production.")
        }

        console.warn("⚠ SMTP not configured; development email URLs will be logged when requested.")
        return false
    }

    await transporter.verify()
    console.log("✓ Email transporter ready")
    return true
}

function logDevelopmentEmailUrl(label, url) {
    if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV EMAIL] ${label} URL:\n${url}`)
    }
}

/**
 * Common HTML wrapper for emails
 */
function renderEmailWrapper(contentHtml) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f17; padding: 40px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #111827; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <div style="display: inline-block; vertical-align: middle;">
                                            <span style="font-size: 22px; font-weight: 800; color: #f8fafc; letter-spacing: -0.5px;">
                                                Interview<span style="color: #10b981;">AI</span>
                                            </span>
                                            <span style="display: block; font-size: 11px; font-weight: 600; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                                                Strategist Pro
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                            ${contentHtml}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #0d1322; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #64748b; text-align: center;">
                            <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Interview AI Strategist Pro. All rights reserved.</p>
                            <p style="margin: 0;">This is an automated operational message. Please do not reply directly to this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
}

/**
 * Send Verification Email
 */
async function sendVerificationEmail({ to, username, verificationUrl }) {
    const from = process.env.SMTP_FROM || '"Interview AI" <noreply@interviewai.com>'

    const contentHtml = `
        <h2 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 0; margin-bottom: 16px;">
            Verify Your Workspace Email
        </h2>
        <p style="margin-bottom: 20px; color: #cbd5e1;">
            Hello <strong style="color: #f8fafc;">${username}</strong>,
        </p>
        <p style="margin-bottom: 24px;">
            Thank you for registering with Interview AI Strategist Pro. To activate your account and gain access to high-stakes interview intelligence, please verify your email address.
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
                Verify Email Address
            </a>
        </div>
        <div style="background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #fbbf24;">
                &#9888; <strong>Notice:</strong> This verification link is valid for <strong>30 minutes</strong>.
            </p>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
            If the button above does not work, copy and paste this URL into your browser:
        </p>
        <p style="font-size: 12px; word-break: break-all; color: #0ea5e9; background-color: rgba(14, 165, 233, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 24px;">
            ${verificationUrl}
        </p>
        <p style="font-size: 13px; color: #64748b; margin: 0;">
            If you did not create an account with Interview AI, you can safely ignore this email.
        </p>
    `

    const html = renderEmailWrapper(contentHtml)

    const transporter = createTransporter()
    if (!transporter) {
        logDevelopmentEmailUrl("Verification", verificationUrl)
        return { success: true, simulated: true }
    }

    try {
        await transporter.sendMail({
            from,
            to,
            subject: "Verify Your Email - Interview AI Strategist Pro",
            html,
            text: `Verify your email: ${verificationUrl}\nThis link expires in 30 minutes.`
        })
        return { success: true }
    } catch (err) {
        console.error(`[EMAIL SERVICE ERROR] Failed to send verification email: ${err.message}`)
        return { success: false, error: "Failed to deliver email through SMTP server" }
    }
}

/**
 * Send Password Reset Email
 */
async function sendPasswordResetEmail({ to, username, resetUrl }) {
    const from = process.env.SMTP_FROM || '"Interview AI" <noreply@interviewai.com>'

    const contentHtml = `
        <h2 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 0; margin-bottom: 16px;">
            Reset Your Account Password
        </h2>
        <p style="margin-bottom: 20px; color: #cbd5e1;">
            Hello <strong style="color: #f8fafc;">${username || 'User'}</strong>,
        </p>
        <p style="margin-bottom: 24px;">
            We received a request to reset the password for your Interview AI Strategist Pro account. Click the button below to choose a new password.
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);">
                Reset Password
            </a>
        </div>
        <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #fca5a5;">
                &#128274; <strong>Security Warning:</strong> This password reset link expires in <strong>15 minutes</strong> and can only be used once.
            </p>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
            If the button above does not work, copy and paste this URL into your browser:
        </p>
        <p style="font-size: 12px; word-break: break-all; color: #0ea5e9; background-color: rgba(14, 165, 233, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 24px;">
            ${resetUrl}
        </p>
        <p style="font-size: 13px; color: #64748b; margin: 0;">
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
        </p>
    `

    const html = renderEmailWrapper(contentHtml)

    const transporter = createTransporter()
    if (!transporter) {
        logDevelopmentEmailUrl("Password reset", resetUrl)
        return { success: true, simulated: true }
    }

    try {
        await transporter.sendMail({
            from,
            to,
            subject: "Reset Your Password - Interview AI Strategist Pro",
            html,
            text: `Reset your password: ${resetUrl}\nThis link expires in 15 minutes and can only be used once.`
        })
        return { success: true }
    } catch (err) {
        console.error(`[EMAIL SERVICE ERROR] Failed to send password reset email: ${err.message}`)
        return { success: false, error: "Failed to deliver email through SMTP server" }
    }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    verifyEmailTransporter
}
