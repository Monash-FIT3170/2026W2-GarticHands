const express = require('express')
const router = express.Router()

// Temporary in-memory store (replaced by database in Phase 10)
let submissions = []

// GET all submissions
router.get('/', (req, res) => {
  res.json(submissions)
})

// POST a new submission
router.post('/', (req, res) => {
  const { content } = req.body

  if (!content) {
    return res.status(400).json({ error: 'Content is required' })
  }

  const submission = {
    id: Date.now().toString(),
    content,
    createdAt: new Date().toISOString()
  }

  submissions.push(submission)
  console.log('New submission:', submission)
  res.status(201).json(submission)
})

module.exports = router
