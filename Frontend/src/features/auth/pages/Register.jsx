import React, { useState } from 'react'
import { Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, UserPlus, Target, Award, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

const Register = () => {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [registeredSuccess, setRegisteredSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [resendStatus, setResendStatus] = useState("")

    const { handleRegister, handleResendVerification } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg("")
        setIsSubmitting(true)

        try {
            await handleRegister({ username, email, password })
            setRegisteredSuccess(true)
        } catch (err) {
            setErrorMsg(err.message || "Registration failed. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResend = async () => {
        setResendStatus("Sending...")
        try {
            const res = await handleResendVerification({ email })
            setResendStatus(res.message || "Verification email sent!")
        } catch (err) {
            setResendStatus(err.message || "Failed to resend.")
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
                            <span>Candidate Onboarding</span>
                        </div>
                        <h1>Accelerate Your <span className="highlight-text">Career Breakthrough</span></h1>
                        <p>
                            Join top candidates leveraging AI-driven strategy plans to land offers at tier-1 technology companies and high-growth scale-ups.
                        </p>
                    </div>

                    <div className="showcase-cards">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Target size={20} />
                            </div>
                            <div className="feature-content">
                                <h3>Tailored Skill Gap Analysis</h3>
                                <p>Identify exactly what knowledge areas to prioritize before your screening calls.</p>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Award size={20} />
                            </div>
                            <div className="feature-content">
                                <h3>Custom Tailored PDF Resumes</h3>
                                <p>Export optimized resume versions tailored specifically to target job descriptions.</p>
                            </div>
                        </div>
                    </div>

                    <div className="showcase-stats">
                        <div className="stat-box">
                            <span className="stat-number">10k+</span>
                            <span className="stat-label">Interview Strategies Generated</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">4.9/5</span>
                            <span className="stat-label">Candidate Satisfaction</span>
                        </div>
                    </div>
                </div>

                {/* Right Glass Form Side */}
                <div className="auth-card-glass">
                    {registeredSuccess ? (
                        <div className="auth-state-box">
                            <div className="state-icon-wrapper state-icon-success">
                                <CheckCircle2 size={36} />
                            </div>
                            <h3>Check Your Email</h3>
                            <p>
                                We've sent a verification link to <strong style={{ color: '#f8fafc' }}>{email}</strong>.
                                Please verify your email address to activate your candidate workspace before logging in.
                            </p>

                            {resendStatus && (
                                <div className="auth-alert auth-alert-info" style={{ width: '100%', boxSizing: 'border-box' }}>
                                    <p>{resendStatus}</p>
                                </div>
                            )}

                            <div className="state-actions">
                                <Link to="/login" className="button primary-button submit-btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                    <span>Proceed to Sign In</span>
                                    <ArrowRight size={18} />
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="inline-resend-btn"
                                    style={{ margin: '0 auto' }}
                                >
                                    Resend Verification Email
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="auth-card-header">
                                <div className="auth-icon-badge">
                                    <UserPlus size={24} />
                                </div>
                                <h2>Create Your Account</h2>
                                <p>Get started with personalized AI interview intelligence today.</p>
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
                                    <label htmlFor="username">Username / Full Name</label>
                                    <div className="input-wrapper">
                                        <input
                                            value={username}
                                            onChange={(e) => { setUsername(e.target.value) }}
                                            type="text"
                                            id="username"
                                            name="username"
                                            placeholder="Alex Morgan"
                                            required
                                        />
                                        <User className="input-icon" size={18} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="email">Email Address</label>
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
                                    <label htmlFor="password">Security Password</label>
                                    <div className="input-wrapper">
                                        <input
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value) }}
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            placeholder="Create a strong password"
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

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="button primary-button submit-btn"
                                >
                                    <span>{isSubmitting ? "Creating Workspace..." : "Register Workspace"}</span>
                                    {isSubmitting ? <RefreshCw className="spin-icon" size={18} /> : <ArrowRight size={18} />}
                                </button>
                            </form>

                            <div className="auth-footer">
                                <p>Already have an account? <Link to={"/login"}>Sign In</Link></p>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Register