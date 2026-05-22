const express = require('express')
const router = express.Router()
const Submission = require('../models/Submission')

router.post('/', async (req, res) => {
  try {
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Submission text is required',
      })
    }

    const newSubmission = new Submission({
      content: text,
    })

    const savedSubmission = await newSubmission.save()

    console.log('Saved submission:', savedSubmission)


    res.status(201).json({
      success: true,
      submittedText: savedSubmission.content,
      submission: savedSubmission,
    })
  } catch (error) {
    console.error('Error saving submission:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to save submission',
    })
  }
})

router.get('/', async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      submissions,
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
    })
  }
})

module.exports = router