const mongoose = require('mongoose');


const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [ true, "Skill is required" ]
    },
    severity: {
        type: String,
        enum: [ "low", "medium", "high" ],
        required: [ true, "Severity is required" ]
    }
}, {
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [ true, "Day is required" ]
    },
    focus: {
        type: String,
        required: [ true, "Focus is required" ]
    },
    tasks: [ {
        type: String,
        required: [ true, "Task is required" ]
    } ]
})

const evidenceSchema = new mongoose.Schema({
    evidence: { type: String, required: true },
    relevance: { type: String, required: true }
}, { _id: false })

const requirementSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    importance: { type: String, enum: ["required", "preferred", "nice_to_have"], required: true },
    status: { type: String, enum: ["STRONG_MATCH", "PARTIAL_MATCH", "WEAK_MATCH", "GAP", "NOT_RELEVANT"], required: true },
    evidence: { type: String, default: null }
}, { _id: false })

const followUpQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    intent: { type: String, required: true },
    answer: { type: String, default: "" }
}, { _id: false })

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [ true, "Job description is required" ]
    },
    resume: {
        type: String,
    },
    selfDescription: {
        type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    atsScore: { type: Number, min: 0, max: 100 },
    roleFitScore: { type: Number, min: 0, max: 100 },
    atsEvidence: [ evidenceSchema ],
    roleFitEvidence: [ evidenceSchema ],
    structuredResumeSkills: [ String ],
    structuredJobRequirements: [ requirementSchema ],
    evidenceMatches: [ requirementSchema ],
    atsBreakdown: {
        keywordMatch: Number,
        skillsMatch: Number,
        experienceRelevance: Number,
        formatting: Number
    },
    strongMatches: [ String ],
    partialMatches: [ String ],
    improvementSuggestions: [ String ],
    followUpQuestions: [ followUpQuestionSchema ],
    technicalQuestions: [ technicalQuestionSchema ],
    behavioralQuestions: [ behavioralQuestionSchema ],
    skillGaps: [ skillGapSchema ],
    preparationPlan: [ preparationPlanSchema ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    title: {
        type: String,
        required: [ true, "Job title is required" ]
    }
}, {
    timestamps: true
})


const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;  