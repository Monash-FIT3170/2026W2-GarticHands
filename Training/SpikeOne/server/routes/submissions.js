const express = require('express')
const router = express.Router()
const Submission = require('../models/Submission')

// GET all submissions, newest first
router.get('/', async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 })
    res.json(submissions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

// POST a new submission
router.post('/', async (req, res) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ error: 'Content is required' })
    }

    const submission = await Submission.create({ content })
    res.status(201).json(submission)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create submission' })
  }
})


module.exports = router
