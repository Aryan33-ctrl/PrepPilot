import { useCallback, useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.js";
import {
    login,
    register,
    logout,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
} from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    const { user, setUser, loading, setLoading } = context

    const handleLogin = useCallback(async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            return data
        } finally {
            setLoading(false)
        }
    }, [setLoading, setUser])

    const handleRegister = useCallback(async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            return data
        } finally {
            setLoading(false)
        }
    }, [setLoading])

    const handleLogout = useCallback(async () => {
        setLoading(true)
        try {
            const data = await logout()
            setUser(null)
            return data
        } finally {
            setLoading(false)
        }
    }, [setLoading, setUser])

    const handleVerifyEmail = useCallback(({ token }) => verifyEmail({ token }), [])

    const handleResendVerification = useCallback(({ email }) => resendVerification({ email }), [])

    const handleForgotPassword = useCallback(({ email }) => forgotPassword({ email }), [])

    const handleResetPassword = useCallback(({ token, password }) => resetPassword({ token, password }), [])

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()
    }, [setLoading, setUser])

    return {
        user,
        loading,
        handleRegister,
        handleLogin,
        handleLogout,
        handleVerifyEmail,
        handleResendVerification,
        handleForgotPassword,
        handleResetPassword
    }
}