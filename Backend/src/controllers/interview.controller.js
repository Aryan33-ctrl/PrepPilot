const mongoose = require("mongoose")
const pdfParse = require("pdf-parse")
const { analyzeCandidateEvidence, matchCandidateEvidence, calculateEvidenceScores, generateFollowUpQuestions, generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        let resumeText = ""
        if (req.file && req.file.buffer) {
            const filename = req.file.originalname || ""
            const isPdfSignature = req.file.buffer.subarray(0, 5).toString("ascii") === "%PDF-"
            if (req.file.mimetype !== "application/pdf" || !/\.pdf$/i.test(filename) || !isPdfSignature) {
                return res.status(400).json({
                    success: false,
                    message: "Resume must be a valid PDF file."
                })
            }
            try {
                const parser = new pdfParse.PDFParse({ data: req.file.buffer })
                const parsed = await parser.getText()
                resumeText = parsed.text || ""
            } catch (pdfErr) {
                return res.status(400).json({
                    success: false,
                    message: "Resume PDF could not be read. Please upload a valid PDF."
                })
            }
            if (!resumeText.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Resume PDF contains no readable text."
                })
            }
        }

        const { selfDescription, jobDescription } = req.body

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({
                success: false,
                message: "Job description is required to generate interview strategy."
            })
        }

        const evidenceAnalysis = await analyzeCandidateEvidence({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })
        const evidenceMatches = matchCandidateEvidence(evidenceAnalysis)
        const evidenceScores = calculateEvidenceScores(evidenceMatches, Boolean(resumeText.trim()))
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            evidenceMatches
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            structuredResumeSkills: evidenceAnalysis.resumeSkills,
            structuredJobRequirements: evidenceAnalysis.jobRequirements.map((requirement) => ({
                ...requirement,
                status: evidenceMatches.find((match) => match.skill === requirement.skill)?.status || "GAP",
                evidence: evidenceMatches.find((match) => match.skill === requirement.skill)?.evidence || null
            })),
            evidenceMatches,
            ...interViewReportByAi,
            atsScore: evidenceScores.atsScore,
            roleFitScore: evidenceScores.roleFitScore,
            atsBreakdown: evidenceScores.atsBreakdown,
            strongMatches: evidenceScores.strongMatches,
            partialMatches: evidenceScores.partialMatches,
            improvementSuggestions: evidenceScores.improvementSuggestions
        })

        res.status(201).json({
            success: true,
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error in generateInterViewReportController:", err)
        if (err.code === "GEMINI_INVALID_RESPONSE") {
            return res.status(502).json({
                success: false,
                message: "The AI service returned an invalid interview report. Please try again."
            })
        }
        res.status(500).json({
            success: false,
            message: "Failed to generate interview report. " + (err.message || ""),
            error: process.env.NODE_ENV === "production" ? undefined : err.stack || err.message
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview ID format."
            })
        }

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            success: true,
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error in getInterviewReportByIdController:", err)
        res.status(500).json({
            success: false,
            message: "Failed to fetch interview report.",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        })
    }
}

/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            success: true,
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error("Error in getAllInterviewReportsController:", err)
        res.status(500).json({
            success: false,
            message: "Failed to fetch interview reports.",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        })
    }

    async function generateFollowUpQuestionsController(req, res) {
        try {
            const { interviewId } = req.params
            if (!mongoose.Types.ObjectId.isValid(interviewId)) {
                return res.status(400).json({ success: false, message: "Invalid interview ID format." })
            }
            const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
            if (!report) return res.status(404).json({ success: false, message: "Interview report not found." })

            const questions = await generateFollowUpQuestions({
                jobDescription: report.jobDescription,
                evidenceMatches: report.evidenceMatches || [],
                resume: report.resume,
                selfDescription: report.selfDescription
            })
            report.followUpQuestions = questions.map((question) => ({ ...question, answer: "" }))
            await report.save()
            res.status(200).json({ success: true, followUpQuestions: report.followUpQuestions })
        } catch (err) {
            console.error("Error generating follow-up questions:", err)
            res.status(err.code === "GEMINI_INVALID_RESPONSE" ? 502 : 500).json({
                success: false,
                message: err.code === "GEMINI_INVALID_RESPONSE"
                    ? "The AI service returned invalid follow-up questions. Please try again."
                    : "Failed to generate follow-up questions."
            })
        }
    }

    async function saveFollowUpAnswersController(req, res) {
        try {
            const { interviewId } = req.params
            const { answers } = req.body
            if (!mongoose.Types.ObjectId.isValid(interviewId) || !Array.isArray(answers)) {
                return res.status(400).json({ success: false, message: "A valid report ID and answers array are required." })
            }
            const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
            if (!report) return res.status(404).json({ success: false, message: "Interview report not found." })
            const answerByQuestion = new Map(answers.map((item) => [item.question, String(item.answer || "").trim()]))
            report.followUpQuestions = (report.followUpQuestions || []).map((item) => ({
                question: item.question,
                intent: item.intent,
                answer: answerByQuestion.get(item.question) ?? item.answer ?? ""
            }))
            await report.save()
            res.status(200).json({ success: true, followUpQuestions: report.followUpQuestions })
        } catch (err) {
            console.error("Error saving follow-up answers:", err)
            res.status(500).json({ success: false, message: "Failed to save follow-up answers." })
        }
    }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        if (!mongoose.Types.ObjectId.isValid(interviewReportId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview report ID format."
            })
        }

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription, followUpQuestions } = interviewReport

        const pdfBuffer = await generateResumePdf({
            resume: resume || "",
            jobDescription,
            selfDescription: selfDescription || "",
            followUpQuestions: followUpQuestions || []
        })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (err) {
        console.error("Error in generateResumePdfController:", err)
        if (err.code === "GEMINI_INVALID_RESPONSE") {
            return res.status(502).json({
                success: false,
                message: "The AI service returned an invalid resume. Please try again."
            })
        }
        res.status(500).json({
            success: false,
            message: "Failed to generate resume PDF.",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateFollowUpQuestionsController, saveFollowUpAnswersController, generateResumePdfController }