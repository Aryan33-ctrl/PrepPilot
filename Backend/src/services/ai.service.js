const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const evidenceAnalysisSchema = z.object({
    resumeSkills: z.array(z.string()).default([]),
    jobRequirements: z.array(z.object({
        skill: z.string(),
        importance: z.enum(["required", "preferred", "nice_to_have"])
    })).default([]),
    candidateEvidence: z.array(z.object({
        skill: z.string(),
        evidence: z.string()
    })).default([])
})

const followUpQuestionsSchema = z.object({
    questions: z.array(z.object({
        question: z.string(),
        intent: z.string()
    })).min(1).max(8)
})

function getAiClient() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY

    if (!apiKey) {
        const error = new Error("Gemini configuration missing: GOOGLE_GENAI_API_KEY is not set.")
        error.code = "GEMINI_CONFIG_MISSING"
        throw error
    }

    return new GoogleGenAI({ apiKey })
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
    atsScore: z.number().min(0).max(100).optional().describe("ATS compatibility score based only on evidence in the resume"),
    roleFitScore: z.number().min(0).max(100).optional().describe("Role fit score based only on evidence in the resume and job description"),
    atsEvidence: z.array(z.object({
        evidence: z.string(),
        relevance: z.string()
    })).optional().describe("Concrete resume evidence supporting the ATS score; do not invent evidence"),
    roleFitEvidence: z.array(z.object({
        evidence: z.string(),
        relevance: z.string()
    })).optional().describe("Concrete resume evidence supporting role fit; do not invent evidence"),
})

function parseAndValidateJson(text, schema, responseName) {
    let parsed
    try {
        parsed = JSON.parse(text)
    } catch (error) {
        const validationError = new Error(`Gemini returned invalid JSON for ${responseName}.`)
        validationError.code = "GEMINI_INVALID_RESPONSE"
        validationError.cause = error
        throw validationError
    }

    const result = schema.safeParse(parsed)
    if (!result.success) {
        const validationError = new Error(`Gemini returned an invalid ${responseName} structure.`)
        validationError.code = "GEMINI_INVALID_RESPONSE"
        validationError.details = result.error.issues
        throw validationError
    }
    return result.data
}

async function analyzeCandidateEvidence({ resume, selfDescription, jobDescription }) {
    const jsonSchema = zodToJsonSchema(evidenceAnalysisSchema)
    delete jsonSchema["$schema"]
    const response = await getAiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract factual skills and requirements for evidence matching.
Resume: ${resume || "No resume supplied"}
Self description: ${selfDescription || "None supplied"}
Job description: ${jobDescription}
Return only skills explicitly supported by the resume or self description. Do not infer experience.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema
        }
    })
    return parseAndValidateJson(response.text, evidenceAnalysisSchema, "candidate evidence")
}

function matchCandidateEvidence(analysis) {
    const candidateSkills = new Set(analysis.resumeSkills.map((skill) => skill.toLowerCase()))
    const candidateEvidence = new Map(analysis.candidateEvidence.map((item) => [item.skill.toLowerCase(), item.evidence]))
    return analysis.jobRequirements.map((requirement) => {
        const skill = requirement.skill.trim()
        const normalizedSkill = skill.toLowerCase()
        const directMatch = [...candidateSkills].some((candidateSkill) =>
            candidateSkill === normalizedSkill ||
            candidateSkill.includes(normalizedSkill) ||
            normalizedSkill.includes(candidateSkill)
        )
        const evidence = candidateEvidence.get(normalizedSkill) ||
            [...candidateEvidence.entries()].find(([key]) => key.includes(normalizedSkill) || normalizedSkill.includes(key))?.[1]
        const status = directMatch && evidence ? "STRONG_MATCH" : directMatch ? "PARTIAL_MATCH" : "GAP"
        return { skill, importance: requirement.importance, status, evidence: evidence || null }
    })
}

function calculateEvidenceScores(matches, hasResume) {
    const weights = { required: 3, preferred: 2, nice_to_have: 1 }
    const points = { STRONG_MATCH: 1, PARTIAL_MATCH: 0.5, WEAK_MATCH: 0, GAP: 0, NOT_RELEVANT: 0 }
    const totalWeight = matches.reduce((total, match) => total + (weights[match.importance] || 1), 0)
    const earnedWeight = matches.reduce((total, match) => total + (weights[match.importance] || 1) * (points[match.status] || 0), 0)
    const keywordMatch = totalWeight ? Math.round((earnedWeight / totalWeight) * 100) : 0
    const formatting = hasResume ? 100 : 70
    const atsScore = Math.round(keywordMatch * 0.6 + formatting * 0.2 + (hasResume ? 80 : 50) * 0.2)
    const requiredMatches = matches.filter((match) => match.importance === "required")
    const roleFitScore = requiredMatches.length
        ? Math.round((requiredMatches.reduce((total, match) => total + (points[match.status] || 0), 0) / requiredMatches.length) * 100)
        : keywordMatch
    const strongMatches = matches.filter((match) => match.status === "STRONG_MATCH").map((match) => match.skill)
    const partialMatches = matches.filter((match) => match.status === "PARTIAL_MATCH").map((match) => match.skill)
    const skillGaps = matches.filter((match) => match.status === "GAP").map((match) => match.skill)
    const suggestions = [
        ...partialMatches.map((skill) => `Clarify responsibilities and measurable impact for ${skill}.`),
        ...skillGaps.map((skill) => `Treat ${skill} as a skill gap and prepare an honest interview response.`)
    ]
    return { atsScore, roleFitScore, atsBreakdown: { keywordMatch, skillsMatch: keywordMatch, experienceRelevance: roleFitScore, formatting }, strongMatches, partialMatches, skillGaps, improvementSuggestions: suggestions }
}

async function generateFollowUpQuestions({ jobDescription, evidenceMatches, resume, selfDescription }) {
    const jsonSchema = zodToJsonSchema(followUpQuestionsSchema)
    delete jsonSchema["$schema"]
    const response = await getAiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate targeted candidate follow-up questions.
Job description: ${jobDescription}
Evidence matches: ${JSON.stringify(evidenceMatches)}
Resume: ${resume || "No resume supplied"}
Self description: ${selfDescription || "None supplied"}
Ask only useful, non-duplicative questions about gaps, partial matches, unclear responsibilities, projects, leadership, architecture, or measurable impact.
Do not ask generic questions such as "tell me about yourself". Each question must have an intent.
Generate fewer questions when the evidence is limited.`,
        config: { responseMimeType: "application/json", responseSchema: jsonSchema }
    })
    return parseAndValidateJson(response.text, followUpQuestionsSchema, "follow-up questions").questions
}

async function generateInterviewReport({ resume, selfDescription, jobDescription, evidenceMatches = [] }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
                        Evidence matches: ${JSON.stringify(evidenceMatches)}

                        Generate a dynamic number of technical and behavioral questions based on the role complexity and evidence quality.
                        Do not default to exactly three questions. Generate approximately 5-8 technical questions when the role and available evidence justify them,
                        and fewer only when the supplied candidate information is genuinely limited. Avoid generic questions and prioritize resume ambiguities,
                        partial matches, measurable impact, architecture decisions, and important job requirements.
                        Include ATS and role-fit scores only when supported by concrete resume evidence.
                        For every evidence item, quote or precisely summarize information from the resume.
`

    const jsonSchema = zodToJsonSchema(interviewReportSchema)
    delete jsonSchema["$schema"]

    const response = await getAiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        }
    })

    return parseAndValidateJson(response.text, interviewReportSchema, "interview report")
}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription, followUpQuestions = [] }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
                        Verified candidate clarifications: ${JSON.stringify(followUpQuestions.filter((item) => item.answer))}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        Use verified candidate clarifications only when they add factual detail. Never invent information or convert unanswered questions into resume claims.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const jsonSchema = zodToJsonSchema(resumePdfSchema)
    delete jsonSchema["$schema"]

    const response = await getAiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        }
    })


    const jsonContent = parseAndValidateJson(response.text, resumePdfSchema, "resume")

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { analyzeCandidateEvidence, matchCandidateEvidence, calculateEvidenceScores, generateFollowUpQuestions, generateInterviewReport, generateResumePdf }