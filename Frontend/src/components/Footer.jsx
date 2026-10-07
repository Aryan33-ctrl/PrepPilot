import React from 'react'
import { Sparkles, Shield, Cpu, Lock } from 'lucide-react'
import './Footer.scss'

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <Sparkles size={16} className="text-emerald" />
            <span>InterviewAI Strategist</span>
          </div>
          <p className="footer-desc">
            Executive-grade interview intelligence. Generates tailor-made preparation roadmaps, high-impact model answers, and skill gap telemetry.
          </p>
        </div>

        <div className="footer-features">
          <div className="feature-item">
            <Shield size={14} />
            <span>Enterprise Security</span>
          </div>
          <div className="feature-item">
            <Cpu size={14} />
            <span>Multi-Model AI Context</span>
          </div>
          <div className="feature-item">
            <Lock size={14} />
            <span>Encrypted Resume Parsing</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} InterviewAI Platform. All rights reserved.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Directive</a>
            <a href="#terms">Terms of Service</a>
            <a href="#security">Security Architecture</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
