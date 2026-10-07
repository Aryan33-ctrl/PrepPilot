import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, generateFollowUpQuestions, saveFollowUpAnswers } from "../services/interview.api"
import { useCallback, useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context.js"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, error, setError, report, setReport, reports, setReports } = context

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError("")
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to generate the interview report."
            console.error("Interview report generation failed:", error)
            setError(message)
        } finally {
            setLoading(false)
        }

        return response?.interviewReport
    }, [setError, setLoading, setReport])

    const getReportById = useCallback(async (reportId) => {
        setLoading(true)
        setError("")
        let response = null
        try {
            response = await getInterviewReportById(reportId)
            setReport(response.interviewReport)
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load the interview report."
            console.error("Interview report fetch failed:", error)
            setError(message)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport
    }, [setError, setLoading, setReport])

    const getReports = useCallback(async () => {
        setLoading(true)
        setError("")
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load interview reports."
            console.error("Interview reports fetch failed:", error)
            setError(message)
        } finally {
            setLoading(false)
        }

        return response?.interviewReports
    }, [setError, setLoading, setReports])

    const getResumePdf = useCallback(async (interviewReportId) => {
        setLoading(true)
        setError("")
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to generate the resume PDF."
            console.error("Resume PDF generation failed:", error)
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading])

    const getFollowUpQuestions = useCallback(async (reportId) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateFollowUpQuestions(reportId)
            setReport((current) => current ? { ...current, followUpQuestions: response.followUpQuestions } : current)
            return response.followUpQuestions
        } catch (error) {
            setError(error.response?.data?.message || "Failed to generate follow-up questions.")
            return null
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading, setReport])

    const submitFollowUpAnswers = useCallback(async (reportId, answers) => {
        setLoading(true)
        setError("")
        try {
            const response = await saveFollowUpAnswers(reportId, answers)
            setReport((current) => current ? { ...current, followUpQuestions: response.followUpQuestions } : current)
            return response.followUpQuestions
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save follow-up answers.")
            return null
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading, setReport])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ getReportById, getReports, interviewId ])

    return { loading, error, report, reports, generateReport, getReportById, getReports, getResumePdf, getFollowUpQuestions, submitFollowUpAnswers }

}