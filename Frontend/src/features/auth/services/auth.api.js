import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000
})

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })
        return response.data
    } catch (err) {
        const message = err.response?.data?.message || "Registration failed. Please check your details and try again."
        throw new Error(message)
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            email, password
        })
        return response.data
    } catch (err) {
        const errorData = err.response?.data || {}
        const error = new Error(errorData.message || "Invalid email or password")
        error.isVerified = errorData.isVerified
        error.email = errorData.email
        throw error
    }
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        return response.data
    } catch (err) {
        const message = err.response?.data?.message || "Logout failed."
        throw new Error(message)
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/get-me")
        return response.data
    } catch (err) {
        const message = err.response?.data?.message || "Failed to fetch user session."
        throw new Error(message)
    }
}

export async function verifyEmail({ token }) {
    try {
        const response = await api.post("/api/auth/verify-email", { token })
        return response.data
    } catch (err) {
        const message = err.response?.data?.message || "Invalid or expired verification token."
        throw new Error(message)
    }
}

export async function resendVerification({ email }) {
    try {
        const response = await api.post("/api/auth/resend-verification", { email })
        return response.data
    } catch (err) {
        const message = err.response?.data?.message || "Failed to resend verification email."
        throw new Error(message)
    }
}

export async function forgotPassword({ email }) {
    try {
        const response = await api.post("/api/auth/forgot-password", { email })
        return response.data
    } catch (err) {
        const message = err.response?.data?.message ||
            (err.code === "ECONNABORTED"
                ? "The password reset request timed out. Please try again."
                : "Failed to request password reset. Please check that the backend is running.")
        throw new Error(message)
    }
}

export async function resetPassword({ token, password }) {
    try {
        const response = await api.post("/api/auth/reset-password", { token, password })
        return response.data
    } catch (err) {
        const message = err.response?.data?.message ||
            (err.code === "ECONNABORTED"
                ? "The password reset request timed out. Please try again."
                : "Failed to reset password. The link may have expired.")
        throw new Error(message)
    }
}