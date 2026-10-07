import React, { useState } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams, Link } from 'react-router'
import Navbar from '../../../components/Navbar.jsx'
import Footer from '../../../components/Footer.jsx'
import {
    ChevronDown, Code, MessageSquareText, Map, Download,
    ArrowLeft, Copy, Check, Calendar, AlertTriangle, ShieldCheck, CheckCircle2
} from 'lucide-react'

const NAV_ITEMS = [
    { id: 'optimization', label: 'Resume Optimization', icon: <ShieldCheck size={18} /> },
    { id: 'follow-up', label: 'Candidate Evidence', icon: <MessageSquareText size={18} /> },
    { id: 'technical', label: 'Technical Questions', icon: <Code size={18} /> },
    { id: 'behavioral', label: 'Behavioral Framework', icon: <MessageSquareText size={18} /> },
    { id: 'roadmap', label: 'Preparation Road Map', icon: <Map size={18} /> },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(index === 0)
    const [copied, setCopied] = useState(false)

    const handleCopy = (e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(item.answer)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <ChevronDown size={18} />
                </span>
            </div>

            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <div className="section-header-line">
                            <span className='q-card__tag q-card__tag--intention'>Evaluator Intention</span>
                        </div>
                        <p>{item.intention}</p>
                    </div>

                    <div className='q-card__section'>
                        <div className="section-header-line">
                            <span className='q-card__tag q-card__tag--answer'>Gold Standard Model Answer</span>
                            <button type="button" onClick={handleCopy} className="copy-btn">
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                <span>{copied ? 'Copied' : 'Copy Answer'}</span>
                            </button>
                        </div>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )

}

const EvidenceList = ({ title, items }) => (
    <div className='evidence-group'>
        <h3>{title}</h3>
        {items?.length ? (
            <ul className='evidence-list'>
                {items.map((item, index) => (
                    <li key={index}>
                        <strong>{item.evidence}</strong>
                        <span>{item.relevance}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className='empty-state-copy'>No evidence was returned for this category.</p>
        )}
    </div>
)

const MatchStatusList = ({ matches }) => (
    <div className='evidence-group'>
        <h3>Requirement matching</h3>
        {matches?.length ? (
            <ul className='evidence-list'>
                {matches.map((match, index) => (
                    <li key={index}>
                        <strong>{match.skill} · {match.status.replaceAll("_", " ")}</strong>
                        <span>{match.evidence || `${match.importance} requirement with no direct resume evidence.`}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className='empty-state-copy'>No structured requirement matches were returned.</p>
        )}
    </div>
)

const FollowUpPanel = ({ report, interviewId, getFollowUpQuestions, submitFollowUpAnswers }) => {
    const [answers, setAnswers] = useState({})
    const questions = report.followUpQuestions || []
    const [saving, setSaving] = useState(false)

    const handleGenerate = async () => {
        await getFollowUpQuestions(interviewId)
    }

    const handleSave = async () => {
        setSaving(true)
        await submitFollowUpAnswers(interviewId, questions.map((item) => ({
            question: item.question,
            answer: answers[item.question] ?? item.answer ?? ""
        })))
        setSaving(false)
    }

    return (
        <section>
            <div className='content-header-row'>
                <h2>Candidate Evidence Questions</h2>
                <button type='button' className='sample-btn' onClick={handleGenerate}>Generate targeted questions</button>
            </div>
            {questions.length ? (
                <div className='follow-up-list'>
                    {questions.map((item, index) => (
                        <div className='follow-up-card' key={index}>
                            <strong>{item.question}</strong>
                            <span>{item.intent}</span>
                            <textarea
                                value={answers[item.question] ?? item.answer ?? ""}
                                onChange={(event) => setAnswers((current) => ({ ...current, [item.question]: event.target.value }))}
                                placeholder='Add factual context, responsibilities, or measurable impact...'
                            />
                        </div>
                    ))}
                    <button type='button' className='pdf-download-btn' onClick={handleSave} disabled={saving}>
                        {saving ? "Saving evidence..." : "Save candidate answers"}
                    </button>
                </div>
            ) : (
                <p className='empty-state-copy'>Generate targeted questions to clarify gaps and strengthen the evidence used for resume tailoring.</p>
            )}
        </section>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day-card'>
        <div className='roadmap-day-card__header'>
            <span className='roadmap-day-card__badge'>Day {day.day}</span>
            <h3 className='roadmap-day-card__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day-card__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <CheckCircle2 size={16} className="task-icon" />
                    <span>{task}</span>
                </li>
            ))}
        </ul>
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const [downloading, setDownloading] = useState(false)
    const { report, loading, error, getResumePdf, getFollowUpQuestions, submitFollowUpAnswers } = useInterview()
    const { interviewId } = useParams()

    const handleDownloadPdf = async () => {
        setDownloading(true)
        await getResumePdf(interviewId)
        setDownloading(false)
    }

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <div className='loader-spinner'>
                    <div className='spinner-ring'></div>
                    <div className='spinner-ring'></div>
                    <div className='spinner-ring'></div>
                </div>
                <h1>Loading Interview Strategy Workspace...</h1>
                {error ? (
                    <p role="alert" className="error-box">{error}</p>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Retrieving question bank parameters and preparation telemetry...</p>
                )}
            </main>
        )
    }

    const score = report.roleFitScore ?? report.matchScore ?? 0
    const scoreColorClass = score >= 80 ? 'score--high' : score >= 60 ? 'score--mid' : 'score--low'
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeOffset = circumference - (score / 100) * circumference

    return (
        <div className='interview-page-container'>
            <Navbar />

            <main className="interview-main-content">
                {/* ── Top Executive Header Bar ── */}
                <div className="interview-header-bar">
                    <div className="header-left">
                        <Link to="/" className="back-link">
                            <ArrowLeft size={16} />
                            <span>Dashboard</span>
                        </Link>

                        <div className="plan-title-wrapper">
                            <h1>{report.title || 'Target Role Interview Strategy'}</h1>
                            <div className="plan-subtitle">
                                <Calendar size={12} />
                                <span>Generated on {report.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
                                <span>&bull;</span>
                                <ShieldCheck size={12} style={{ color: '#10b981' }} />
                                <span>Multi-Model Verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="header-right">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                            className='pdf-download-btn'
                        >
                            <Download size={16} />
                            <span>{downloading ? 'Exporting PDF...' : 'Download Tailored Resume'}</span>
                        </button>
                    </div>
                </div>

                {/* ── 3-Column Dashboard Workstation Layout ── */}
                <div className="interview-layout-grid">

                    {/* ── Left Navigation Column ── */}
                    <nav className='interview-nav-panel'>
                        <span className='nav-section-label'>Strategy Sections</span>
                        {NAV_ITEMS.map(item => {
                            let count = 0
                            if (item.id === 'optimization') count = report.atsEvidence?.length || 0
                            if (item.id === 'follow-up') count = report.followUpQuestions?.length || 0
                            if (item.id === 'technical') count = report.technicalQuestions?.length || 0
                            if (item.id === 'behavioral') count = report.behavioralQuestions?.length || 0
                            if (item.id === 'roadmap') count = report.preparationPlan?.length || 0

                            return (
                                <button
                                    key={item.id}
                                    className={`nav-tab-button ${activeNav === item.id ? 'nav-tab-button--active' : ''}`}
                                    onClick={() => setActiveNav(item.id)}
                                >
                                    <span className='nav-tab-icon'>{item.icon}</span>
                                    <span>{item.label}</span>
                                    <span className="nav-tab-count">{count}</span>
                                </button>
                            )
                        })}
                    </nav>

                    {/* ── Center Content Area ── */}
                    <div className='interview-center-panel'>
                        {activeNav === 'follow-up' && (
                            <FollowUpPanel
                                report={report}
                                interviewId={interviewId}
                                getFollowUpQuestions={getFollowUpQuestions}
                                submitFollowUpAnswers={submitFollowUpAnswers}
                            />
                        )}
                        {activeNav === 'optimization' && (
                            <section>
                                <div className='content-header-row'>
                                    <h2>Resume Optimization &amp; Evidence</h2>
                                    <span className='items-count-badge'>
                                        {report.atsScore != null ? `${report.atsScore}/100 ATS` : 'Legacy report'}
                                    </span>
                                </div>
                                {report.atsScore != null ? (
                                    <>
                                        <div className='optimization-score-grid'>
                                            <div className='optimization-score-card'>
                                                <span>ATS Score</span>
                                                <strong>{report.atsScore}/100</strong>
                                            </div>
                                            <div className='optimization-score-card'>
                                                <span>Role Fit</span>
                                                <strong>{report.roleFitScore ?? report.matchScore ?? 0}/100</strong>
                                            </div>
                                        </div>
                                        {report.atsBreakdown && (
                                            <div className='ats-breakdown-card'>
                                                {Object.entries(report.atsBreakdown).map(([label, value]) => (
                                                    <div key={label}>
                                                        <span>{label.replace(/([A-Z])/g, " $1")}</span>
                                                        <strong>{value}%</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className='evidence-card'>
                                            <EvidenceList title='Evidence supporting ATS alignment' items={report.atsEvidence} />
                                            <EvidenceList title='Evidence supporting role fit' items={report.roleFitEvidence} />
                                            <MatchStatusList matches={report.evidenceMatches} />
                                            {report.improvementSuggestions?.length > 0 && (
                                                <div className='evidence-group'>
                                                    <h3>Resume improvement suggestions</h3>
                                                    <ul className='evidence-list'>
                                                        {report.improvementSuggestions.map((suggestion, index) => <li key={index}><span>{suggestion}</span></li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className='evidence-card'>
                                        <p className='empty-state-copy'>This report was generated before ATS evidence was enabled. Generate a new report to see transparent resume optimization details.</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {activeNav === 'technical' && (
                            <section>
                                <div className='content-header-row'>
                                    <h2>Technical Questions &amp; Architecture</h2>
                                    <span className='items-count-badge'>{report.technicalQuestions?.length || 0} Questions</span>
                                </div>
                                <div className='q-list'>
                                    {report.technicalQuestions?.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'behavioral' && (
                            <section>
                                <div className='content-header-row'>
                                    <h2>Behavioral Questions &amp; STAR Answers</h2>
                                    <span className='items-count-badge'>{report.behavioralQuestions?.length || 0} Questions</span>
                                </div>
                                <div className='q-list'>
                                    {report.behavioralQuestions?.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'roadmap' && (
                            <section>
                                <div className='content-header-row'>
                                    <h2>7-Day Preparation Road Map</h2>
                                    <span className='items-count-badge'>{report.preparationPlan?.length || 0}-Day Matrix</span>
                                </div>
                                <div className='roadmap-timeline'>
                                    {report.preparationPlan?.map((day) => (
                                        <RoadMapDay key={day.day} day={day} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── Right Sidebar Column ── */}
                    <aside className='interview-sidebar'>

                        {/* Match Score Radial Gauge */}
                        <div className='sidebar-card'>
                            <p className='sidebar-title'>Role Fit Telemetry</p>
                            <div className='match-gauge'>
                                <div className="gauge-ring-container">
                                    <svg viewBox="0 0 100 100">
                                        <circle className="bg-circle" cx="50" cy="50" r="45" />
                                        <circle
                                            className={`val-circle ${scoreColorClass}`}
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeOffset}
                                        />
                                    </svg>
                                    <div className="gauge-center-text">
                                        <span className="gauge-value">{score}</span>
                                        <span className="gauge-pct">MATCH %</span>
                                    </div>
                                </div>

                                <p className={`gauge-status ${scoreColorClass}`}>
                                    {score >= 80 ? 'Exceptional Competency Match' : score >= 60 ? 'Strong Foundation Match' : 'Gap Targeted Prep Required'}
                                </p>
                            </div>
                        </div>

                        {/* Skill Gaps Analysis */}
                        <div className='sidebar-card'>
                            <p className='sidebar-title'>Identified Skill Gaps</p>
                            <div className='skill-gaps-list'>
                                {report.skillGaps?.map((gap, i) => (
                                    <span key={i} className={`skill-badge skill-badge--${gap.severity}`}>
                                        <AlertTriangle size={12} />
                                        <span>{gap.skill}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Interview