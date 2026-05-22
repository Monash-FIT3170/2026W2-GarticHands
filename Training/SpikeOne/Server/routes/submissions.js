const express = require('express')
const router = express.Router()

router.post('/', (req, res) => {
    const { text } = req.body

    console.log("New Submission: ", text)

    res.status(201).json({
        success: true,
        submittedText: text 
    })
})

module.exports = router