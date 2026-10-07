const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, (req, res, next) => {
    upload.single("resume")(req, res, (error) => {
        if (error && error.code === "INVALID_RESUME_FILE") {
            return res.status(400).json({ success: false, message: error.message })
        }
        if (error && error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ success: false, message: "Resume PDF must be 3 MB or smaller." })
        }
        if (error) return next(error)
        next()
    })
}, interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)

interviewRouter.post("/report/:interviewId/follow-up-questions", authMiddleware.authUser, interviewController.generateFollowUpQuestionsController)
interviewRouter.post("/report/:interviewId/follow-up-answers", authMiddleware.authUser, interviewController.saveFollowUpAnswersController)


/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)



module.exports = interviewRouter