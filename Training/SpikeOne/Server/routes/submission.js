const express = require('express')
const Submission = require('../models/Submission')

function createSubmissionsRouter(SubmissionModel = Submission) {
  const router = express.Router()

  router.post('/', async (req, res) => {
    try {
      const { text } = req.body

      if (!text || !text.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Submission text is required',
        })
      }

      const newSubmission = new SubmissionModel({
        content: text,
      })

      const savedSubmission = await newSubmission.save()

      res.status(201).json({
        success: true,
        submittedText: savedSubmission.content,
        submission: savedSubmission,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save submission',
      })
    }
  })

  router.get('/', async (req, res) => {
    try {
      const submissions = await SubmissionModel.find().sort({ createdAt: -1 })

      res.status(200).json({
        success: true,
        submissions,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submissions',
      })
    }
  })

  return router
}

module.exports = createSubmissionsRouter