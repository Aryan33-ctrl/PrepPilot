import React, { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'
import Navbar from '../../../components/Navbar.jsx'
import Footer from '../../../components/Footer.jsx'
import {
    Sparkles, Briefcase, User, UploadCloud, FileText,
    Info, ArrowRight, Clock, Calendar, ChevronRight, CheckCircle, X
} from 'lucide-react'

const SAMPLE_JD = `Senior Full Stack Engineer at TechCorp
Requirements:
- 5+ years of experience with React, Node.js, and TypeScript
- Experience building scalable cloud infrastructure on AWS/GCP
- Proficiency with GraphQL/REST APIs, PostgreSQL, and Redis caching
- Strong understanding of CI/CD pipelines, Docker, and microservices architecture`

const Home = () => {
    const { loading, error, generateReport, reports } = useInterview()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [selectedFileName, setSelectedFileName] = useState("")
    const [formError, setFormError] = useState("")
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFileName(file.name)
        }
    }

    const clearSelectedFile = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (resumeInputRef.current) {
            resumeInputRef.current.value = ""
        }
        setSelectedFileName("")
    }

    const handleInsertSampleJd = () => {
        setJobDescription(SAMPLE_JD)
    }

    const handleGenerateReport = async () => {
        const resumeFile = resumeInputRef.current?.files?.[0]
        setFormError("")

        if (!jobDescription.trim()) {
            setFormError("Please provide a job description before generating your strategy.")
            return
        }

        if (!resumeFile && !selfDescription.trim()) {
            setFormError("Upload a PDF resume or provide a candidate summary before continuing.")
            return
        }

        if (resumeFile && (resumeFile.type !== "application/pdf" || !resumeFile.name.toLowerCase().endsWith(".pdf"))) {
            setFormError("Please upload a valid PDF resume. DOCX files are not supported yet.")
            return
        }

        const data = await generateReport({ jobDescription, selfDescription, resumeFile })
        if (data && data._id) {
            navigate(`/interview/${data._id}`)
        }
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <div className='loader-spinner'>
                    <div className='spinner-ring'></div>
                    <div className='spinner-ring'></div>
                    <div className='spinner-ring'></div>
                </div>
                <h1>Synthesizing Interview Strategy Plan...</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing role competencies and candidate profile parameters...</p>
            </main>
        )
    }

    return (
        <div className='home-page-container'>
            <Navbar />

            <main className="home-main-content">
                {(formError || error) && (
                    <div role="alert" className="error-box">
                        {formError || error}
                    </div>
                )}
                {/* Hero Section */}
                <section className='hero-section'>
                    <div className="hero-badge">
                        <Sparkles size={14} />
                        <span>AI Strategy Workstation</span>
                    </div>
                    <h1>Build Your Winning <span className='highlight'>Interview Plan</span></h1>
                    <p>Let our multi-model AI analyze target job requirements alongside your experience to build a personalized interview road map.</p>
                </section>

                {/* Main Interactive Workstation Card */}
                <div className='interview-card'>
                    <div className='interview-card__body'>

                        {/* Left Panel - Job Description */}
                        <div className='panel panel--left'>
                            <div className='panel__header'>
                                <span className='panel__icon'>
                                    <Briefcase size={18} />
                                </span>
                                <h2>Target Job Specification</h2>
                                <button type="button" onClick={handleInsertSampleJd} className="sample-btn">
                                    Sample JD
                                </button>
                                <span className='badge badge--required'>Required</span>
                            </div>

                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                className='panel__textarea'
                                placeholder={`Paste the full job description or vacancy details here...\ne.g. 'Senior Frontend Engineer requirements: React, TypeScript, System Design, State Management...'`}
                                maxLength={5000}
                            />

                            <div className='char-counter-bar'>
                                <span>{jobDescription.length} / 5000 characters</span>
                                <div className="counter-progress">
                                    <div
                                        className="counter-fill"
                                        style={{ width: `${Math.min(100, (jobDescription.length / 5000) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className='panel-divider' />

                        {/* Right Panel - Candidate Profile */}
                        <div className='panel panel--right'>
                            <div className='panel__header'>
                                <span className='panel__icon'>
                                    <User size={18} />
                                </span>
                                <h2>Your Candidate Profile</h2>
                            </div>

                            {/* Upload Resume */}
                            <div className='upload-section'>
                                <div className='section-label'>
                                    <span>Upload Resume</span>
                                    <span className='badge badge--best'>Recommended</span>
                                </div>

                                <label className={`dropzone ${selectedFileName ? 'dropzone--active' : ''}`} htmlFor='resume'>
                                    {selectedFileName ? (
                                        <div className="selected-file-badge">
                                            <CheckCircle size={16} />
                                            <span>{selectedFileName}</span>
                                            <button type="button" onClick={clearSelectedFile} className="file-remove-btn">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className='dropzone__icon'>
                                                <UploadCloud size={24} />
                                            </div>
                                            <p className='dropzone__title'>Click to browse or drop resume file</p>
                                            <p className='dropzone__subtitle'>PDF or DOCX document (Max 5MB)</p>
                                        </>
                                    )}
                                    <input
                                        ref={resumeInputRef}
                                        onChange={handleFileChange}
                                        hidden
                                        type='file'
                                        id='resume'
                                        name='resume'
                                        accept='.pdf'
                                    />
                                </label>
                            </div>

                            {/* OR Divider */}
                            <div className='or-divider'><span>OR PROVIDE SUMMARY</span></div>

                            {/* Quick Self-Description */}
                            <div className='self-description'>
                                <label className='section-label' htmlFor='selfDescription'>Quick Background Summary</label>
                                <textarea
                                    value={selfDescription}
                                    onChange={(e) => setSelfDescription(e.target.value)}
                                    id='selfDescription'
                                    name='selfDescription'
                                    className='panel__textarea panel__textarea--short'
                                    placeholder="Summarize your years of experience, core technical stack, and recent projects if you don't have a resume handy..."
                                />
                            </div>

                            {/* Info Box */}
                            <div className='info-box'>
                                <Info size={18} className='info-box__icon' />
                                <p>Provide either a <strong>Resume File</strong> or a <strong>Background Summary</strong> to extract high-accuracy interview questions.</p>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer Action Bar */}
                    <div className='interview-card__footer'>
                        <div className='footer-info'>
                            <Clock size={16} />
                            <span>Neural Strategy Generation &bull; Estimated time ~25s</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerateReport}
                            className='generate-btn'>
                            <Sparkles size={18} />
                            <span>Generate My Strategy Plan</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Recent Strategy Plans List */}
                {reports && reports.length > 0 && (
                    <section className='recent-reports'>
                        <div className="section-header-row">
                            <h2>My Generated Strategy Plans</h2>
                            <span className="plans-count-badge">{reports.length} Plans Saved</span>
                        </div>

                        <div className='reports-grid'>
                            {reports.map(report => (
                                <div
                                    key={report._id}
                                    className='report-card'
                                    onClick={() => navigate(`/interview/${report._id}`)}
                                >
                                    <div className="card-top">
                                        <div>
                                            <h3 className="report-title">{report.title || 'Untitled Strategy Plan'}</h3>
                                            <p className='report-date'>
                                                <Calendar size={12} />
                                                <span>{new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="card-bottom">
                                        <span className={`score-pill ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                            Match: {report.matchScore}%
                                        </span>
                                        <ChevronRight size={18} className="card-arrow" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    )
}

export default Home