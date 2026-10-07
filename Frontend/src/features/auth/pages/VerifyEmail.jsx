import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import "../auth.form.scss"
import { CheckCircle2, AlertCircle, RefreshCw, Mail, ArrowRight, ShieldCheck } from 'lucide-react'

const VerifyEmail = () => {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")

    const { handleVerifyEmail, handleResendVerification } = useAuth()

    const [status, setStatus] = useState("verifying") // "verifying" | "success" | "error"
    const [message, setMessage] = useState("")
    const [resendEmail, setResendEmail] = useState("")
    const [resendStatus, setResendStatus] = useState("")
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setMessage("No verification token provided in URL.")
            return
        }

        const verify = async () => {
            try {
                const data = await handleVerifyEmail({ token })
                setStatus("success")
                setMessage(data.message || "Your email has been verified successfully!")
            } catch (err) {
                setStatus("error")
                setMessage(err.message || "Invalid or expired verification token.")
            }
        }

        verify()
    }, [handleVerifyEmail, token])

    const handleResend = async (e) => {
        e.preventDefault()
        if (!resendEmail) return

        setIsResending(true)
        setResendStatus("")
        try {
            const data = await handleResendVerification({ email: resendEmail })
            setResendStatus(data.message || "Verification link sent! Please check your inbox.")
        } catch (err) {
            setResendStatus(err.message || "Failed to resend verification email.")
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="auth-page-wrapper">
            <Navbar />

            <main className="auth-split-container" style={{ gridTemplateColumns: '1fr', maxWidth: '600px' }}>
                <div className="auth-card-glass">
                    <div className="auth-card-header" style={{ alignItems: 'center', textAlign: 'center' }}>
                        <div className="auth-icon-badge" style={{ margin: '0 auto 0.5rem auto' }}>
                            <ShieldCheck size={28} />
                        </div>
                        <h2>Workspace Email Verification</h2>
                        <p>Validating candidate security credentials...</p>
                    </div>

                    {status === "verifying" && (
                        <div className="auth-state-box">
                            <div className="loader-spinner" style={{ margin: '1rem 0' }}>
                                <div className="spinner-ring"></div>
                                <div className="spinner-ring"></div>
                                <div className="spinner-ring"></div>
                            </div>
                            <h3>Verifying Your Workspace Token</h3>
                            <p>Please wait while we confirm your email verification link...</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="auth-state-box">
                            <div className="state-icon-wrapper state-icon-success">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3>Verification Successful!</h3>
                            <p>{message}</p>

                            <div className="state-actions" style={{ marginTop: '1rem' }}>
                                <Link to="/login" className="button primary-button submit-btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                    <span>Sign In to Workspace</span>
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="auth-state-box">
                            <div className="state-icon-wrapper state-icon-error">
                                <AlertCircle size={40} />
                            </div>
                            <h3>Verification Failed or Link Expired</h3>
                            <p>{message}</p>

                            <div style={{ width: '100%', marginTop: '1rem', textAlign: 'left' }}>
                                <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                                    Need a new verification link?
                                </h4>

                                {resendStatus && (
                                    <div className="auth-alert auth-alert-info">
                                        <p>{resendStatus}</p>
                                    </div>
                                )}

                                <form onSubmit={handleResend} className="auth-form">
                                    <div className="input-group">
                                        <label htmlFor="resendEmail">Your Work Email</label>
                                        <div className="input-wrapper">
                                            <input
                                                value={resendEmail}
                                                onChange={(e) => setResendEmail(e.target.value)}
                                                type="email"
                                                id="resendEmail"
                                                placeholder="alex@company.com"
                                                required
                                            />
                                            <Mail className="input-icon" size={18} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isResending}
                                        className="button primary-button submit-btn"
                                    >
                                        <span>{isResending ? "Sending Link..." : "Resend Verification Link"}</span>
                                        {isResending ? <RefreshCw className="spin-icon" size={18} /> : <ArrowRight size={18} />}
                                    </button>
                                </form>
                            </div>

                            <div className="auth-footer" style={{ width: '100%', marginTop: '1.5rem' }}>
                                <p>Already verified? <Link to="/login">Sign In</Link></p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default VerifyEmail
