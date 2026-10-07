const multer = require("multer")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (req, file, callback) => {
        const hasPdfExtension = typeof file.originalname === "string" && /\.pdf$/i.test(file.originalname)
        if (file.mimetype !== "application/pdf" || !hasPdfExtension) {
            const error = new Error("Resume must be a PDF file.")
            error.code = "INVALID_RESUME_FILE"
            return callback(error)
        }
        callback(null, true)
    }
})


module.exports = upload