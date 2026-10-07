require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")
const { verifyEmailTransporter } = require("./src/services/email.service")

const port = process.env.PORT || 3000

async function startServer() {
    console.log("✓ Environment loaded")

    if (process.env.GOOGLE_GENAI_API_KEY) {
        console.log("✓ Gemini configuration loaded")
    } else {
        console.error("✗ Gemini configuration missing: GOOGLE_GENAI_API_KEY")
    }

    if (!process.env.JWT_SECRET) {
        console.error("✗ JWT configuration missing: JWT_SECRET")
    }

    await connectToDB()

    try {
        await verifyEmailTransporter()
    } catch (error) {
        console.error("✗ SMTP connection failed:", error.message)
        if (process.env.NODE_ENV === "production") {
            throw error
        }
    }

    app.listen(port, () => {
        console.log(`✓ Server running on port ${port}`)
    })
}

startServer().catch((error) => {
    console.error("✗ Server startup failed:", error.message)
    process.exitCode = 1
})