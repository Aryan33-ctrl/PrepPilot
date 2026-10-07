import React, { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import "../auth.form.scss"
import { Mail, ArrowRight, KeyRound, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

const ForgotPassword = () => {
    const { handleForgotPassword } = useAuth()

    const [email, setEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [infoMsg, setInfoMsg] = useState("")
    const [errorMsg, setErrorMsg] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg("")
        setIsSubmitting(true)

        try {
            const res = await handleForgotPassword({ email })
            setSubmitted(true)
            setInfoMsg(res.message || "If an account with that email exists, password reset instructions have been sent.")
        } catch (err) {
            setErrorMsg(err.message || "Failed to process password reset request.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-page-wrapper">
            <Navbar />

            <main className="auth-split-container" style={{ gridTemplateColumns: '1fr', maxWidth: '520px' }}>
                <div className="auth-card-glass">
                    {submitted ? (
                        <div className="auth-state-box">
                            <div className="state-icon-wrapper state-icon-success">
                                <CheckCircle2 size={36} />
                            </div>
                            <h3>Reset Instructions Sent</h3>
                            <p>{infoMsg}</p>
                            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                Please check your inbox and click the reset link within 15 minutes.
                            </p>

                            <div className="state-actions">
                                <Link to="/login" className="button primary-button submit-btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                    <span>Return to Sign In</span>
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="auth-card-header">
                                <div className="auth-icon-badge">
                                    <KeyRound size={24} />
                                </div>
                                <h2>Reset Your Password</h2>
                                <p>Enter your account email to receive secure password reset instructions.</p>
                            </div>

                            {errorMsg && (
                                <div className="auth-alert auth-alert-error">
                                    <AlertCircle className="alert-icon" size={18} />
                                    <div className="alert-content">
                                        <p>{errorMsg}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="input-group">
                                    <label htmlFor="email">Work Email Address</label>
                                    <div className="input-wrapper">
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                            id="email"
                                            placeholder="alex@company.com"
                                            required
                                        />
                                        <Mail className="input-icon" size={18} />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="button primary-button submit-btn"
                                >
                                    <span>{isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}</span>
                                    {isSubmitting ? <RefreshCw className="spin-icon" size={18} /> : <ArrowRight size={18} />}
                                </button>
                            </form>

                            <div className="auth-footer">
                                <p>Remembered your password? <Link to="/login">Sign In</Link></p>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default ForgotPassword
