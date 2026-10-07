import React, { useState } from 'react'
import { useSearchParams, useParams, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import "../auth.form.scss"
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

const ResetPassword = () => {
    const [searchParams] = useSearchParams()
    const params = useParams()
    const token = searchParams.get("token") || params.token

    const { handleResetPassword } = useAuth()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg("")

        if (!token) {
            setErrorMsg("Missing password reset token in URL.")
            return
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match.")
            return
        }

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters long.")
            return
        }

        setIsSubmitting(true)

        try {
            await handleResetPassword({ token, password })
            setSuccess(true)
        } catch (err) {
            setErrorMsg(err.message || "Failed to reset password. The link may have expired.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-page-wrapper">
            <Navbar />

            <main className="auth-split-container" style={{ gridTemplateColumns: '1fr', maxWidth: '520px' }}>
                <div className="auth-card-glass">
                    {success ? (
                        <div className="auth-state-box">
                            <div className="state-icon-wrapper state-icon-success">
                                <CheckCircle2 size={36} />
                            </div>
                            <h3>Password Reset Successfully!</h3>
                            <p>Your password has been updated. You can now log in with your new credentials.</p>

                            <div className="state-actions">
                                <Link to="/login" className="button primary-button submit-btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                    <span>Proceed to Sign In</span>
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="auth-card-header">
                                <div className="auth-icon-badge">
                                    <ShieldCheck size={24} />
                                </div>
                                <h2>Set New Password</h2>
                                <p>Choose a strong password for your workspace account.</p>
                            </div>

                            {errorMsg && (
                                <div className="auth-alert auth-alert-error">
                                    <AlertCircle className="alert-icon" size={18} />
                                    <div className="alert-content">
                                        <p>{errorMsg}</p>
                                    </div>
                                </div>
                            )}

                            {!token && (
                                <div className="auth-alert auth-alert-warning">
                                    <AlertCircle className="alert-icon" size={18} />
                                    <div className="alert-content">
                                        <p>Invalid or missing reset token. Please request a new password reset link.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="input-group">
                                    <label htmlFor="password">New Security Password</label>
                                    <div className="input-wrapper">
                                        <input
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            placeholder="Enter new password"
                                            required
                                            minLength={6}
                                        />
                                        <Lock className="input-icon" size={18} />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <div className="input-wrapper">
                                        <input
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            type={showPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            placeholder="Confirm new password"
                                            required
                                            minLength={6}
                                        />
                                        <Lock className="input-icon" size={18} />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !token}
                                    className="button primary-button submit-btn"
                                >
                                    <span>{isSubmitting ? "Updating Password..." : "Reset Password"}</span>
                                    {isSubmitting ? <RefreshCw className="spin-icon" size={18} /> : <ArrowRight size={18} />}
                                </button>
                            </form>

                            <div className="auth-footer">
                                <p>Back to <Link to="/login">Sign In</Link></p>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default ResetPassword
