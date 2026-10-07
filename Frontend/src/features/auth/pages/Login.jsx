import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, Zap, ShieldCheck, AlertCircle, RefreshCw, MailWarning } from 'lucide-react'

const Login = () => {
    const { handleLogin, handleResendVerification } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [isUnverified, setIsUnverified] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [resendMsg, setResendMsg] = useState("")
    const [isResending, setIsResending] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg("")
        setIsUnverified(false)
        setResendMsg("")
        setIsSubmitting(true)

        try {
            await handleLogin({ email, password })
            navigate('/')
        } catch (err) {
            const msg = err.message || "Invalid email or password"
            setErrorMsg(msg)
            if (err.isVerified === false || msg.toLowerCase().includes("verify your email")) {
                setIsUnverified(true)
                setUnverifiedEmail(err.email || email)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResend = async () => {
        const targetEmail = unverifiedEmail || email
        if (!targetEmail) return

        setIsResending(true)
        setResendMsg("")
        try {
            const res = await handleResendVerification({ email: targetEmail })
            setResendMsg(res.message || "Verification email sent! Please check your inbox.")
        } catch (err) {
            setResendMsg(err.message || "Failed to send verification email.")
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="auth-page-wrapper">
            <Navbar />

            <main className="auth-split-container">
                {/* Left Showcase Side */}
                <div className="auth-showcase">
                    <div className="showcase-header">
                        <div className="showcase-badge">
                            <Sparkles size={14} />
                            <span>Executive Intelligence</span>
                        </div>
                        <h1>Master Your Next <span className="highlight-text">High-Stakes</span> Interview</h1>
                        <p>
                            Generate role-specific technical question banks, behavioral frameworks, and targeted 7-day preparation roadmaps in seconds.
                        </p>
                    </div>

                    <div className="showcase-cards">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Zap size={20} />
                            </div>
                            <div className="feature-content">
                                <h3>Targeted JD Analysis</h3>
                                <p>Deep parsing of job specifications to extract key competencies and tech stack requirements.</p>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="feature-content">
                                <h3>Model Answer Benchmarks</h3>
                                <p>Review gold-standard responses tailored to your experience tier and background.</p>
                            </div>
                        </div>
                    </div>

                    <div className="showcase-stats">
                        <div className="stat-box">
                            <span className="stat-number">98.4%</span>
                            <span className="stat-label">Role Relevance Match</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">3.2x</span>
                            <span className="stat-label">Higher Offer Probability</span>
                        </div>
                    </div>
                </div>

                {/* Right Glass Form Side */}
                <div className="auth-card-glass">
                    <div className="auth-card-header">
                        <div className="auth-icon-badge">
                            <ShieldCheck size={24} />
                        </div>
                        <h2>Sign In to Workspace</h2>
                        <p>Enter your credentials to access your interview strategy dashboard.</p>
                    </div>

                    {errorMsg && (
                        <div className={`auth-alert ${isUnverified ? 'auth-alert-warning' : 'auth-alert-error'}`}>
                            {isUnverified ? <MailWarning className="alert-icon" size={20} /> : <AlertCircle className="alert-icon" size={20} />}
                            <div className="alert-content">
                                <p>{errorMsg}</p>
                                {isUnverified && (
                                    <div style={{ marginTop: '0.25rem' }}>
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={isResending}
                                            className="inline-resend-btn"
                                        >
                                            {isResending ? "Sending..." : "Resend Verification Email"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {resendMsg && (
                        <div className="auth-alert auth-alert-info">
                            <div className="alert-content">
                                <p>{resendMsg}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label htmlFor="email">Work Email</label>
                            <div className="input-wrapper">
                                <input
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value) }}
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="alex@company.com"
                                    required
                                />
                                <Mail className="input-icon" size={18} />
                            </div>
                        </div>

                        <div className="input-group">
                            <div className="label-row">
                                <label htmlFor="password">Password</label>
                                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
                            </div>
                            <div className="input-wrapper">
                                <input
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value) }}
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    placeholder="••••••••••••"
                                    required
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

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="button primary-button submit-btn"
                        >
                            <span>{isSubmitting ? "Authenticating..." : "Access Workspace"}</span>
                            {isSubmitting ? <RefreshCw className="spin-icon" size={18} /> : <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Don't have an account? <Link to={"/register"}>Create Account</Link></p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Login