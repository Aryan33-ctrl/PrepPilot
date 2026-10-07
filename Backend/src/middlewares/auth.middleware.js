const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({
        token
    })

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Token is invalid."
        })
    }

    try {
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.")
            return res.status(500).json({
                message: "Authentication is not configured."
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Invalid or expired token."
        })
    }

}

module.exports = { authUser }